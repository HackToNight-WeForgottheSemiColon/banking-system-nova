import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { LessThanOrEqual, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { MailService } from '../mail/mail.service'
import { NotificationsService } from '../notifications/notifications.service'
import { TransferService } from '../transfer/transfer.service'
import { User } from '../users/entities/user.entity'
import { CreateScheduledTransferDto } from './dto/create-scheduled-transfer.dto'
import { ScheduledTransfer } from './entities/scheduled-transfer.entity'

@Injectable()
export class ScheduledTransfersService
  implements OnModuleInit, OnModuleDestroy
{
  private schedulerInterval: NodeJS.Timeout | null = null

  constructor(
    @InjectRepository(ScheduledTransfer)
    private readonly scheduledTransferRepository: Repository<ScheduledTransfer>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly transferService: TransferService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService
  ) {}

  onModuleInit() {
    // Run the scheduler task check every 30 seconds
    this.schedulerInterval = setInterval(() => {
      this.processScheduledTransfers().catch((err) => {
        console.error('Error running scheduled transfers worker:', err)
      })
    }, 30000)
  }

  onModuleDestroy() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
    }
  }

  async create(
    dto: CreateScheduledTransferDto,
    userId: number
  ): Promise<ScheduledTransfer> {
    // 1. Verify owner of source account
    const sourceAccount = await this.accountsRepository.findOne({
      where: { accountNumber: dto.fromAccount, userId }
    })
    if (!sourceAccount) {
      throw new ForbiddenException(
        'Source account not found or does not belong to you.'
      )
    }

    // 2. Verify destination account exists
    const destAccount = await this.accountsRepository.findOne({
      where: { accountNumber: dto.toAccount }
    })
    if (!destAccount) {
      throw new NotFoundException('Destination account not found.')
    }

    const scheduled = new ScheduledTransfer()
    scheduled.userId = userId
    scheduled.fromAccount = dto.fromAccount
    scheduled.toAccount = dto.toAccount
    scheduled.amount = dto.amount
    scheduled.description = dto.description || ''
    scheduled.frequency = dto.frequency
    scheduled.nextRun = new Date(dto.startDate)
    scheduled.active = true

    return this.scheduledTransferRepository.save(scheduled)
  }

  async findAll(userId: number): Promise<ScheduledTransfer[]> {
    return this.scheduledTransferRepository.find({
      where: { userId },
      order: { nextRun: 'ASC' }
    })
  }

  async remove(id: number, userId: number): Promise<void> {
    const scheduled = await this.scheduledTransferRepository.findOne({
      where: { id, userId }
    })
    if (!scheduled) {
      throw new NotFoundException('Scheduled transfer not found.')
    }
    await this.scheduledTransferRepository.remove(scheduled)
  }

  /**
   * Process all active scheduled transfers that are currently due
   */
  async processScheduledTransfers() {
    const now = new Date()
    const dueTransfers = await this.scheduledTransferRepository.find({
      where: {
        active: true,
        nextRun: LessThanOrEqual(now)
      }
    })

    if (dueTransfers.length === 0) return

    console.log(
      `[Scheduler] Found ${dueTransfers.length} scheduled transfers to process.`
    )

    for (const transfer of dueTransfers) {
      try {
        console.log(
          `[Scheduler] Executing scheduled transfer ${transfer.id}: Rs. ${transfer.amount} from ${transfer.fromAccount} to ${transfer.toAccount}`
        )
        // Execute transaction
        await this.transferService.execute(
          {
            fromAccount: transfer.fromAccount,
            toAccount: transfer.toAccount,
            amount: Number(transfer.amount),
            description: transfer.description || 'Scheduled Transfer'
          },
          transfer.userId
        )
        console.log(
          `[Scheduler] Scheduled transfer ${transfer.id} executed successfully.`
        )
      } catch (err: any) {
        console.error(
          `[Scheduler] Scheduled transfer ${transfer.id} failed:`,
          err.message || err
        )
        // Send a failure notification
        try {
          await this.notificationsService.create(
            transfer.userId,
            'TRANSFER_FAILED',
            'Scheduled Transfer Failed',
            `Your scheduled transfer of Rs. ${Number(transfer.amount).toLocaleString('en-US')} to ${transfer.toAccount} failed due to: ${err.message || 'Unknown error'}.`
          )

          // Fetch user and send transfer failed email
          const user = await this.accountsRepository.manager.findOne(User, {
            where: { id: transfer.userId }
          })
          if (user) {
            await this.mailService.sendTransferFailedEmail(
              user.email,
              user.fullName,
              Number(transfer.amount),
              transfer.toAccount,
              err.message || 'Unknown error'
            )
          }
        } catch (notifyErr) {
          console.error(
            '[Scheduler] Failed to create scheduled transfer error notification:',
            notifyErr
          )
        }
      } finally {
        // Compute next run date to keep scheduler advanced
        const nextRun = this.calculateNextRun(
          transfer.nextRun,
          transfer.frequency
        )
        transfer.nextRun = nextRun
        await this.scheduledTransferRepository.save(transfer)
        console.log(
          `[Scheduler] Scheduled transfer ${transfer.id} updated. Next run: ${nextRun.toISOString()}`
        )
      }
    }
  }

  private calculateNextRun(current: Date, frequency: string): Date {
    const next = new Date(current)
    const now = new Date()
    // Loop to ensure the next run is in the future
    while (next <= now) {
      if (frequency === 'daily') {
        next.setDate(next.getDate() + 1)
      } else if (frequency === 'weekly') {
        next.setDate(next.getDate() + 7)
      } else if (frequency === 'monthly') {
        next.setMonth(next.getMonth() + 1)
      } else {
        // Fallback safety to avoid infinite loop
        next.setDate(next.getDate() + 1)
      }
    }
    return next
  }
}
