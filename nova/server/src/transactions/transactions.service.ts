import {
  BadRequestException,
  ForbiddenException,
  Injectable
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AccountsService } from '../accounts/accounts.service'
import { Transaction } from './entities/transaction.entity'

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    private accountsService: AccountsService
  ) {}

  async findByAccount(accountNumber: string, userId: number) {
    // Verify the account belongs to the user
    const isOwner = await this.accountsService.verifyOwnership(
      accountNumber,
      userId
    )
    if (!isOwner) {
      throw new ForbiddenException(
        'Account not found or does not belong to you.'
      )
    }

    return this.transactionsRepository.find({
      where: [{ fromAccount: accountNumber }, { toAccount: accountNumber }],
      select: [
        'id',
        'fromAccount',
        'toAccount',
        'amount',
        'description',
        'status',
        'category',
        'createdAt'
      ],
      order: { createdAt: 'DESC' }
    })
  }
}
