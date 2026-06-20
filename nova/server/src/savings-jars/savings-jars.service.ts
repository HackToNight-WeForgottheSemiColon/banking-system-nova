import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { Transaction } from '../transactions/entities/transaction.entity'
import { CreateSavingsJarDto, UpdateSavingsJarDto } from './dto/savings-jar.dto'
import { SavingsJar } from './entities/savings-jar.entity'

@Injectable()
export class SavingsJarsService {
  constructor(
    @InjectRepository(SavingsJar)
    private readonly savingsJarRepository: Repository<SavingsJar>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly notificationsService: NotificationsService,
    private readonly dataSource: DataSource
  ) {}

  async create(userId: number, dto: CreateSavingsJarDto): Promise<SavingsJar> {
    if (dto.targetAmount <= 0) {
      throw new BadRequestException('Target amount must be greater than 0.')
    }

    const jar = this.savingsJarRepository.create({
      userId,
      name: dto.name,
      targetAmount: dto.targetAmount,
      currentAmount: 0,
      roundUpEnabled: dto.roundUpEnabled ?? false,
      roundUpRule: dto.roundUpRule ?? 100
    })

    const saved = await this.savingsJarRepository.save(jar)

    if (saved.roundUpEnabled) {
      await this.disableOtherRoundUps(userId, saved.id)
    }

    return saved
  }

  async findAll(userId: number): Promise<SavingsJar[]> {
    return this.savingsJarRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' }
    })
  }

  async findOne(userId: number, id: number): Promise<SavingsJar> {
    const jar = await this.savingsJarRepository.findOne({
      where: { id, userId }
    })
    if (!jar) {
      throw new NotFoundException(`Savings jar with ID ${id} not found.`)
    }
    return jar
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateSavingsJarDto
  ): Promise<SavingsJar> {
    const jar = await this.findOne(userId, id)

    if (dto.name !== undefined) jar.name = dto.name
    if (dto.targetAmount !== undefined) {
      if (dto.targetAmount <= 0) {
        throw new BadRequestException('Target amount must be greater than 0.')
      }
      jar.targetAmount = dto.targetAmount
    }
    if (dto.roundUpEnabled !== undefined)
      jar.roundUpEnabled = dto.roundUpEnabled
    if (dto.roundUpRule !== undefined) jar.roundUpRule = dto.roundUpRule

    const saved = await this.savingsJarRepository.save(jar)

    if (saved.roundUpEnabled) {
      await this.disableOtherRoundUps(userId, saved.id)
    }

    return saved
  }

  async delete(
    userId: number,
    id: number,
    refundAccountNumber: string
  ): Promise<{ ok: boolean; refunded: number }> {
    const jar = await this.findOne(userId, id)
    const currentBalance = Number(jar.currentAmount)

    if (currentBalance > 0) {
      if (!refundAccountNumber) {
        throw new BadRequestException(
          'Refund account is required to withdraw remaining funds before deletion.'
        )
      }

      // Verify refund account ownership
      const refundAccount = await this.accountsRepository.findOne({
        where: { accountNumber: refundAccountNumber, userId }
      })
      if (!refundAccount) {
        throw new ForbiddenException(
          'Refund account not found or does not belong to you.'
        )
      }

      const queryRunner = this.dataSource.createQueryRunner()
      await queryRunner.connect()
      await queryRunner.startTransaction()

      try {
        // Credit the refund account
        await queryRunner.query(
          `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2 AND user_id = $3`,
          [currentBalance, refundAccountNumber, userId]
        )

        // Record the transaction
        await queryRunner.query(
          `INSERT INTO transactions (from_account, to_account, amount, description, category, created_by)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            `JAR:${jar.id}`,
            refundAccountNumber,
            currentBalance,
            `Refund: Jar Deactivation (${jar.name})`,
            'Savings',
            userId
          ]
        )

        await queryRunner.commitTransaction()

        await this.notificationsService.create(
          userId,
          'TRANSFER',
          'Savings Refunded',
          `Refunded Rs. ${currentBalance.toLocaleString('en-US')} from "${jar.name}" jar to account ${refundAccountNumber} upon jar deactivation.`
        )
      } catch (err) {
        await queryRunner.rollbackTransaction()
        throw err
      } finally {
        await queryRunner.release()
      }
    }

    await this.savingsJarRepository.remove(jar)
    return { ok: true, refunded: currentBalance }
  }

  async deposit(
    userId: number,
    id: number,
    fromAccountNumber: string,
    amount: number
  ): Promise<SavingsJar> {
    if (amount <= 0) {
      throw new BadRequestException('Deposit amount must be greater than 0.')
    }

    const jar = await this.findOne(userId, id)

    // Verify source account ownership
    const sourceAccount = await this.accountsRepository.findOne({
      where: { accountNumber: fromAccountNumber, userId }
    })
    if (!sourceAccount) {
      throw new ForbiddenException(
        'Source account not found or does not belong to you.'
      )
    }

    if (Number(sourceAccount.balance) < amount) {
      throw new BadRequestException('Insufficient balance in bank account.')
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Debit from account with balance check
      const debitResult = await queryRunner.query(
        `UPDATE accounts SET balance = balance - $1 WHERE account_number = $2 AND user_id = $3 AND balance >= $1 RETURNING balance`,
        [amount, fromAccountNumber, userId]
      )

      if (!debitResult || debitResult.length === 0) {
        throw new BadRequestException('Insufficient balance.')
      }

      // Credit the jar
      await queryRunner.query(
        `UPDATE savings_jars SET current_amount = current_amount + $1 WHERE id = $2 AND user_id = $3`,
        [amount, jar.id, userId]
      )

      // Record transaction
      await queryRunner.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          fromAccountNumber,
          `JAR:${jar.id}`,
          amount,
          `Deposit: ${jar.name}`,
          'Savings',
          userId
        ]
      )

      await queryRunner.commitTransaction()

      await this.notificationsService.create(
        userId,
        'TRANSFER',
        'Savings Deposit',
        `Deposited Rs. ${amount.toLocaleString('en-US')} into your "${jar.name}" jar.`
      )
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }

    return this.findOne(userId, id)
  }

  async withdraw(
    userId: number,
    id: number,
    toAccountNumber: string,
    amount: number
  ): Promise<SavingsJar> {
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than 0.')
    }

    const jar = await this.findOne(userId, id)
    const currentBalance = Number(jar.currentAmount)

    if (currentBalance < amount) {
      throw new BadRequestException('Insufficient balance in savings jar.')
    }

    // Verify destination account ownership
    const destAccount = await this.accountsRepository.findOne({
      where: { accountNumber: toAccountNumber, userId }
    })
    if (!destAccount) {
      throw new ForbiddenException(
        'Destination account not found or does not belong to you.'
      )
    }

    const queryRunner = this.dataSource.createQueryRunner()
    await queryRunner.connect()
    await queryRunner.startTransaction()

    try {
      // Debit from jar
      const debitResult = await queryRunner.query(
        `UPDATE savings_jars SET current_amount = current_amount - $1 WHERE id = $2 AND user_id = $3 AND current_amount >= $1 RETURNING current_amount`,
        [amount, jar.id, userId]
      )

      if (!debitResult || debitResult.length === 0) {
        throw new BadRequestException('Insufficient balance in savings jar.')
      }

      // Credit to destination account
      await queryRunner.query(
        `UPDATE accounts SET balance = balance + $1 WHERE account_number = $2 AND user_id = $3`,
        [amount, toAccountNumber, userId]
      )

      // Record transaction
      await queryRunner.query(
        `INSERT INTO transactions (from_account, to_account, amount, description, category, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `JAR:${jar.id}`,
          toAccountNumber,
          amount,
          `Withdrawal: ${jar.name}`,
          'Savings',
          userId
        ]
      )

      await queryRunner.commitTransaction()

      await this.notificationsService.create(
        userId,
        'TRANSFER',
        'Savings Withdrawal',
        `Withdrew Rs. ${amount.toLocaleString('en-US')} from "${jar.name}" jar to account ${toAccountNumber}.`
      )
    } catch (err) {
      await queryRunner.rollbackTransaction()
      throw err
    } finally {
      await queryRunner.release()
    }

    return this.findOne(userId, id)
  }

  // Active round-up jar helper
  async getActiveRoundUpJar(userId: number): Promise<SavingsJar | null> {
    return this.savingsJarRepository.findOne({
      where: { userId, roundUpEnabled: true }
    })
  }

  private async disableOtherRoundUps(
    userId: number,
    activeJarId: number
  ): Promise<void> {
    await this.savingsJarRepository
      .createQueryBuilder()
      .update(SavingsJar)
      .set({ roundUpEnabled: false })
      .where('userId = :userId AND id != :activeJarId', { userId, activeJarId })
      .execute()
  }
}
