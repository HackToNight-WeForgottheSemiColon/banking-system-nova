import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { User } from '../users/entities/user.entity'
import { AuditLog } from './entities/audit-log.entity'

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>
  ) {}

  async getSystemOverview() {
    const users = await this.usersRepository.find({
      order: { id: 'ASC' }
    })

    const accounts = await this.accountsRepository.find({
      order: { id: 'ASC' }
    })

    const auditLogs = await this.auditLogsRepository.find({
      order: { id: 'DESC' },
      take: 100
    })

    // Calculate aggregations
    const totalUsers = users.length
    const totalAccounts = accounts.length
    const totalDeposits = accounts.reduce(
      (sum, acc) => sum + Number(acc.balance || 0),
      0
    )

    const totalTransactions = await this.transactionsRepository.count()
    const totalVolumeResult = await this.transactionsRepository
      .createQueryBuilder('tx')
      .select('SUM(tx.amount)', 'sum')
      .getRawOne()
    const totalVolume = Number(totalVolumeResult?.sum || 0)

    return {
      users,
      accounts,
      auditLogs,
      stats: {
        totalUsers,
        totalAccounts,
        totalDeposits,
        totalTransactions,
        totalVolume
      }
    }
  }

  async updateUserRole(userId: number, role: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }
    user.role = role
    await this.usersRepository.save(user)

    // Log audit event
    const log = this.auditLogsRepository.create({
      event: 'ADMIN_UPDATE_USER_ROLE',
      payload: { userId, username: user.username, role }
    })
    await this.auditLogsRepository.save(log)

    return user
  }

  async adjustAccountBalance(
    accountNumber: string,
    amount: number,
    action: 'set' | 'deposit' | 'withdraw'
  ) {
    const account = await this.accountsRepository.findOne({
      where: { accountNumber }
    })
    if (!account) {
      throw new Error('Account not found')
    }

    const oldBalance = Number(account.balance || 0)
    let newBalance = oldBalance

    if (action === 'set') {
      newBalance = amount
    } else if (action === 'deposit') {
      newBalance = oldBalance + amount
    } else if (action === 'withdraw') {
      newBalance = oldBalance - amount
    }

    if (newBalance < 0) {
      throw new Error('Account balance cannot be negative')
    }

    account.balance = newBalance
    await this.accountsRepository.save(account)

    // Log audit event
    const log = this.auditLogsRepository.create({
      event: 'ADMIN_BALANCE_ADJUSTMENT',
      payload: {
        accountNumber,
        accountName: account.accountName,
        action,
        amount,
        oldBalance,
        newBalance
      }
    })
    await this.auditLogsRepository.save(log)

    return account
  }
}
