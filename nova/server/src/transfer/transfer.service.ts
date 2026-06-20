import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, DataSource, In, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { AuditLog } from '../admin/entities/audit-log.entity'
import { Budget } from '../budgets/entities/budget.entity'
import { MailService } from '../mail/mail.service'
import { NotificationsService } from '../notifications/notifications.service'
import { SavingsJarsService } from '../savings-jars/savings-jars.service'
import { Transaction } from '../transactions/entities/transaction.entity'
import { User } from '../users/entities/user.entity'
import { VirtualCardsService } from '../virtual-cards/virtual-cards.service'
import { TransferDto } from './dto/transfer.dto'

@Injectable()
export class TransferService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    private notificationsService: NotificationsService,
    private mailService: MailService,
    private dataSource: DataSource,
    private readonly virtualCardsService: VirtualCardsService,
    private readonly savingsJarsService: SavingsJarsService
  ) {}

  async execute(dto: TransferDto, userId: number) {
    if (dto.cardNumber || dto.cardId) {
      let cardNumber = dto.cardNumber
      if (dto.cardId) {
        const card = await this.virtualCardsService.findById(userId, dto.cardId)
        cardNumber = card.cardNumber
      }
      if (!cardNumber) {
        throw new BadRequestException(
          'Card number is required when paying with card.'
        )
      }

      const cardAccount = await this.virtualCardsService.validateCardUsage(
        cardNumber,
        dto.amount
      )
      dto.fromAccount = cardAccount.accountNumber

      const cardLast4 = cardNumber.slice(-4)
      const cardSuffix = `(Card: ${cardLast4})`
      dto.description = dto.description
        ? `${dto.description} ${cardSuffix}`
        : cardSuffix
    }

    if (!dto.fromAccount) {
      throw new BadRequestException('Source account or card is required.')
    }

    if (dto.fromAccount === dto.toAccount) {
      throw new BadRequestException('Cannot transfer to the same account.')
    }

    // Verify ownership
    const sourceAccount = await this.accountsRepository.findOne({
      where: { accountNumber: dto.fromAccount, userId }
    })
    if (!sourceAccount) {
      throw new ForbiddenException(
        'Source account not found or does not belong to you.'
      )
    }

    // Verify destination exists
    const destAccount = await this.accountsRepository.findOne({
      where: { accountNumber: dto.toAccount }
    })
    if (!destAccount) {
      throw new NotFoundException('Destination account not found.')
    }

    // Resolve active round-up jar if virtual card is used
    let roundUpJar = null
    let roundUpAmount = 0
    if (dto.cardNumber || dto.cardId) {
      try {
        roundUpJar = await this.savingsJarsService.getActiveRoundUpJar(userId)
        if (roundUpJar) {
          const rule = Number(roundUpJar.roundUpRule)
          const amount = Number(dto.amount)
          const nextMultiple = Math.ceil(amount / rule) * rule
          const diff = nextMultiple - amount
          if (diff > 0) {
            roundUpAmount = diff
          }
        }
      } catch (err) {
        console.error('Failed to resolve active round-up jar:', err)
      }
    }

    // Atomic transaction
    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Debit with balance check
      const debitResult = await queryRunner.query(
        `UPDATE accounts SET balance = balance - $1
         WHERE account_number = $2 AND user_id = $3 AND balance >= $1
         RETURNING balance`,
        [dto.amount, dto.fromAccount, userId]
      )

      if (!debitResult || debitResult.length === 0) {
        throw new BadRequestException('Insufficient balance.')
      }

      let roundUpExecuted = false
      if (roundUpJar && roundUpAmount > 0) {
        const currentBalance = Number(debitResult[0].balance)
        if (currentBalance >= roundUpAmount) {
          // Debit round-up
          await queryRunner.query(
            `UPDATE accounts SET balance = balance - $1 WHERE account_number = $2 AND user_id = $3`,
            [roundUpAmount, dto.fromAccount, userId]
          )

          // Credit savings jar
          await queryRunner.query(
            `UPDATE savings_jars SET current_amount = current_amount + $1 WHERE id = $2 AND user_id = $3`,
            [roundUpAmount, roundUpJar.id, userId]
          )

          // Record transaction
          await queryRunner.query(
            `INSERT INTO transactions (from_account, to_account, amount, description, category, created_by)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              dto.fromAccount,
              `JAR:${roundUpJar.id}`,
              roundUpAmount,
              `Spare Change Round-up (${roundUpJar.name})`,
              'Savings',
              userId
            ]
          )

          roundUpExecuted = true
        }
      }

      // Credit destination
      await queryRunner.query(
        `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2`,
        [dto.amount, dto.toAccount]
      )

      // Record transaction
      const category = this.parseCategory(dto.description || '')
      const [txRecord] = await queryRunner.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, from_account, to_account, amount, description, status, category, created_at`,
        [
          dto.fromAccount,
          dto.toAccount,
          dto.amount,
          dto.description || '',
          category,
          userId
        ]
      )

      // Audit log
      await queryRunner.query(
        `INSERT INTO audit_logs (event, payload) VALUES ($1, $2)`,
        [
          'TRANSFER',
          JSON.stringify({
            from: dto.fromAccount,
            to: dto.toAccount,
            amount: dto.amount,
            userId,
            transactionId: txRecord.id,
            roundUp:
              roundUpExecuted && roundUpJar
                ? { jarId: roundUpJar.id, amount: roundUpAmount }
                : null
          })
        ]
      )

      await queryRunner.commitTransaction()

      // 1. Trigger Notification for Sender
      try {
        await this.notificationsService.create(
          userId,
          'TRANSFER',
          'Transfer Successful',
          `Sent Rs. ${Number(dto.amount).toLocaleString('en-US')} to account ${dto.toAccount}.`
        )

        // Send round-up notifications
        if (roundUpJar && roundUpAmount > 0) {
          if (roundUpExecuted) {
            await this.notificationsService.create(
              userId,
              'TRANSFER',
              'Spare Change Swept',
              `Spare change of Rs. ${roundUpAmount.toLocaleString('en-US')} swept into your "${roundUpJar.name}" jar.`
            )
          } else {
            await this.notificationsService.create(
              userId,
              'TRANSFER',
              'Round-Up Skipped',
              `Spare change round-up of Rs. ${roundUpAmount.toLocaleString('en-US')} for "${roundUpJar.name}" was skipped due to insufficient balance.`
            )
          }
        }

        // Send Transfer Receipt Email
        try {
          const userRepo = this.dataSource.getRepository(User)
          const user = await userRepo.findOne({ where: { id: userId } })
          if (user) {
            await this.mailService.sendTransferSuccessEmail(
              user.email,
              user.fullName,
              dto.fromAccount,
              dto.toAccount,
              Number(dto.amount),
              String(txRecord.id)
            )
          }
        } catch (mailErr) {
          console.error('Failed to send transfer success email:', mailErr)
        }

        // 2. Trigger Notification for Recipient (if registered)
        if (destAccount.userId && destAccount.userId !== userId) {
          await this.notificationsService.create(
            destAccount.userId,
            'TRANSFER',
            'Funds Received',
            `Received Rs. ${Number(dto.amount).toLocaleString('en-US')} from account ${dto.fromAccount}.`
          )
        }

        // 3. Check for Budget Alerts (Phase 2 & 4 integration)
        const budgetRepo = this.dataSource.getRepository(Budget)
        const budget = await budgetRepo.findOne({
          where: { userId, category }
        })

        if (budget) {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const accounts = await this.accountsRepository.find({
            where: { userId }
          })
          const accountNums = accounts.map((a) => a.accountNumber)

          const txsInMonth = await this.transactionsRepository.find({
            where: {
              fromAccount: In(accountNums),
              category,
              createdAt: Between(startOfMonth, new Date())
            },
            select: ['amount']
          })

          const spent = txsInMonth.reduce((acc, t) => acc + Number(t.amount), 0)

          if (spent > Number(budget.monthlyLimit)) {
            await this.notificationsService.create(
              userId,
              'BUDGET_EXCEEDED',
              'Budget Exceeded',
              `Alert: Your monthly spending on "${category}" has reached Rs. ${spent.toLocaleString('en-US')}, exceeding your limit of Rs. ${Number(budget.monthlyLimit).toLocaleString('en-US')}.`
            )
          }
        }
      } catch (notifyErr) {
        // Log notification failure but do not crash the successful transfer
        console.error('Failed to dispatch notifications/alerts:', notifyErr)
      }

      return {
        ok: true,
        message: 'Transfer completed successfully.',
        transaction: txRecord
      }
    } catch (error) {
      await queryRunner.rollbackTransaction()
      throw error
    } finally {
      await queryRunner.release()
    }
  }

  private parseCategory(description: string): string {
    const desc = (description || '').toLowerCase()
    if (
      /bill|utility|power|electric|water|internet|phone|telecom|insurance|tax|gas|ceb|leco|slt|mobitel|dialog|hutch/.test(
        desc
      )
    ) {
      return 'Bills'
    }
    if (
      /food|grocery|groceries|restaurant|cafe|eat|lunch|dinner|breakfast|uber eats|pizza|kfc|mcdonald|keells|cargills|supermarket/.test(
        desc
      )
    ) {
      return 'Food'
    }
    if (
      /transport|travel|ride|uber|pickme|taxi|bus|train|fuel|petrol|diesel|flight|air/.test(
        desc
      )
    ) {
      return 'Transport'
    }
    if (
      /shopping|store|super|shop|amazon|daraz|ebay|clothing|clothes|shoes|gifts|mall/.test(
        desc
      )
    ) {
      return 'Shopping'
    }
    if (
      /netflix|spotify|cinema|movie|tickets|games|gaming|concert|gym|sports|ent|fun/.test(
        desc
      )
    ) {
      return 'Entertainment'
    }
    return 'Others'
  }
}
