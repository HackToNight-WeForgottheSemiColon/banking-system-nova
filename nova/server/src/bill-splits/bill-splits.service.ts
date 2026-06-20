import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { NotificationsService } from '../notifications/notifications.service'
import { TransferService } from '../transfer/transfer.service'
import { User } from '../users/entities/user.entity'
import { CreateBillSplitDto } from './dto/create-bill-split.dto'
import { BillSplit } from './entities/bill-split.entity'

@Injectable()
export class BillSplitsService {
  constructor(
    @InjectRepository(BillSplit)
    private readonly billSplitsRepository: Repository<BillSplit>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    private readonly notificationsService: NotificationsService,
    private readonly transferService: TransferService
  ) {}

  async create(
    requesterId: number,
    dto: CreateBillSplitDto
  ): Promise<BillSplit> {
    const requester = await this.usersRepository.findOne({
      where: { id: requesterId }
    })
    if (!requester) {
      throw new NotFoundException('Requester user not found.')
    }

    const payer = await this.usersRepository.findOne({
      where: { username: dto.payerUsername }
    })
    if (!payer) {
      throw new NotFoundException(
        `User with username "${dto.payerUsername}" not found.`
      )
    }

    if (requester.id === payer.id) {
      throw new BadRequestException('Cannot split a bill with yourself.')
    }

    const split = this.billSplitsRepository.create({
      requesterId: requester.id,
      payerId: payer.id,
      amount: dto.amount,
      description: dto.description,
      status: 'pending',
      transactionId: dto.transactionId || null
    })

    const saved = await this.billSplitsRepository.save(split)

    // Notify payer in real time
    await this.notificationsService.create(
      payer.id,
      'BILL_SPLIT',
      'Bill Split Request',
      `${requester.fullName} requested Rs. ${Number(dto.amount).toLocaleString('en-US')} for: ${dto.description}`
    )

    return saved
  }

  async findPendingByPayer(payerId: number): Promise<any[]> {
    const splits = await this.billSplitsRepository.find({
      where: { payerId, status: 'pending' },
      order: { createdAt: 'DESC' }
    })

    const result = []
    for (const split of splits) {
      const requester = await this.usersRepository.findOne({
        where: { id: split.requesterId }
      })
      result.push({
        ...split,
        requesterUsername: requester?.username || 'unknown',
        requesterFullName: requester?.fullName || 'Unknown User'
      })
    }
    return result
  }

  async findMyRequests(requesterId: number): Promise<any[]> {
    const splits = await this.billSplitsRepository.find({
      where: { requesterId },
      order: { createdAt: 'DESC' }
    })

    const result = []
    for (const split of splits) {
      const payer = await this.usersRepository.findOne({
        where: { id: split.payerId }
      })
      result.push({
        ...split,
        payerUsername: payer?.username || 'unknown',
        payerFullName: payer?.fullName || 'Unknown User'
      })
    }
    return result
  }

  async approve(
    payerId: number,
    splitId: number,
    fromAccountNumber: string
  ): Promise<BillSplit> {
    const split = await this.billSplitsRepository.findOne({
      where: { id: splitId, payerId }
    })
    if (!split) {
      throw new NotFoundException('Bill split request not found.')
    }

    if (split.status !== 'pending') {
      throw new BadRequestException(
        'This bill split has already been processed.'
      )
    }

    // Find requester's accounts
    const requesterAccounts = await this.accountsRepository.find({
      where: { userId: split.requesterId },
      order: { id: 'ASC' } // Use primary (first) account
    })

    if (requesterAccounts.length === 0) {
      throw new BadRequestException(
        'Requester has no accounts to receive funds.'
      )
    }

    const toAccountNumber = requesterAccounts[0].accountNumber

    // Execute transfer
    const transferResult = await this.transferService.execute(
      {
        fromAccount: fromAccountNumber,
        toAccount: toAccountNumber,
        amount: Number(split.amount),
        description: `Split Bill: ${split.description}`
      },
      payerId
    )

    split.status = 'approved'
    split.transactionId = transferResult.transaction.id
    const saved = await this.billSplitsRepository.save(split)

    // Notify requester
    const payer = await this.usersRepository.findOne({ where: { id: payerId } })
    await this.notificationsService.create(
      split.requesterId,
      'BILL_SPLIT_APPROVED',
      'Split Request Approved',
      `${payer?.fullName || 'Someone'} approved your split request of Rs. ${Number(split.amount).toLocaleString('en-US')}.`
    )

    return saved
  }

  async decline(payerId: number, splitId: number): Promise<BillSplit> {
    const split = await this.billSplitsRepository.findOne({
      where: { id: splitId, payerId }
    })
    if (!split) {
      throw new NotFoundException('Bill split request not found.')
    }

    if (split.status !== 'pending') {
      throw new BadRequestException(
        'This bill split has already been processed.'
      )
    }

    split.status = 'declined'
    const saved = await this.billSplitsRepository.save(split)

    // Notify requester
    const payer = await this.usersRepository.findOne({ where: { id: payerId } })
    await this.notificationsService.create(
      split.requesterId,
      'BILL_SPLIT_DECLINED',
      'Split Request Declined',
      `${payer?.fullName || 'Someone'} declined your split request of Rs. ${Number(split.amount).toLocaleString('en-US')}.`
    )

    return saved
  }
}
