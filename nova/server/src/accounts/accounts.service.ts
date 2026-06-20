import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from './entities/account.entity'

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>
  ) {}

  findByUserId(userId: number) {
    return this.accountsRepository.find({
      where: { userId },
      select: ['id', 'userId', 'accountNumber', 'accountName', 'balance'],
      order: { id: 'ASC' }
    })
  }

  findByAccountNumber(accountNumber: string) {
    return this.accountsRepository.findOne({
      where: { accountNumber },
      select: ['id', 'userId', 'accountNumber', 'accountName', 'balance']
    })
  }

  async verifyOwnership(
    accountNumber: string,
    userId: number
  ): Promise<boolean> {
    const account = await this.accountsRepository.findOne({
      where: { accountNumber, userId }
    })
    return !!account
  }

  async create(
    userId: number,
    accountNumber: string,
    accountName: string,
    pin: string = '0000'
  ) {
    const existing = await this.accountsRepository.findOne({
      where: { accountNumber }
    })
    if (existing) {
      throw new ConflictException('Account number already exists.')
    }

    const account = this.accountsRepository.create({
      userId,
      accountNumber,
      accountName,
      balance: 1000.0, // starting balance for convenience
      pin
    })
    return this.accountsRepository.save(account)
  }

  async updateNickname(
    accountNumber: string,
    userId: number,
    nickname: string
  ) {
    const account = await this.accountsRepository.findOne({
      where: { accountNumber, userId }
    })
    if (!account) {
      throw new NotFoundException(
        'Account not found or does not belong to you.'
      )
    }
    account.accountName = nickname
    return this.accountsRepository.save(account)
  }

  async remove(accountNumber: string, userId: number) {
    const account = await this.accountsRepository.findOne({
      where: { accountNumber, userId }
    })
    if (!account) {
      throw new NotFoundException(
        'Account not found or does not belong to you.'
      )
    }
    return this.accountsRepository.remove(account)
  }
}
