import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, In, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Budget } from '../budgets/entities/budget.entity'
import { Transaction } from '../transactions/entities/transaction.entity'

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>
  ) {}

  private async getUserAccountNumbers(userId: number): Promise<string[]> {
    const accounts = await this.accountsRepository.find({
      where: { userId },
      select: ['accountNumber']
    })
    return accounts.map((a) => a.accountNumber)
  }

  async getSpendingSummary(userId: number) {
    const accountNumbers = await this.getUserAccountNumbers(userId)
    if (accountNumbers.length === 0) {
      return []
    }

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const endOfMonth = new Date(startOfMonth)
    endOfMonth.setMonth(endOfMonth.getMonth() + 1)

    const txs = await this.transactionsRepository.find({
      where: {
        fromAccount: In(accountNumbers),
        createdAt: Between(startOfMonth, endOfMonth)
      },
      select: ['amount', 'category']
    })

    const summary: Record<string, number> = {}
    for (const tx of txs) {
      const cat = tx.category || 'Others'
      summary[cat] = (summary[cat] || 0) + Number(tx.amount)
    }

    return Object.entries(summary).map(([category, amount]) => ({
      category,
      amount
    }))
  }

  async getTrends(userId: number) {
    const accountNumbers = await this.getUserAccountNumbers(userId)
    if (accountNumbers.length === 0) {
      return []
    }

    // Last 6 months range
    const startRange = new Date()
    startRange.setMonth(startRange.getMonth() - 5)
    startRange.setDate(1)
    startRange.setHours(0, 0, 0, 0)

    const txs = await this.transactionsRepository.find({
      where: {
        fromAccount: In(accountNumbers),
        createdAt: Between(startRange, new Date())
      },
      select: ['amount', 'createdAt']
    })

    // Prepare months map
    const monthsMap: Record<string, number> = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toLocaleString('en-US', { month: 'short' })
      monthsMap[monthKey] = 0
    }

    for (const tx of txs) {
      const monthKey = new Date(tx.createdAt).toLocaleString('en-US', {
        month: 'short'
      })
      if (monthsMap[monthKey] !== undefined) {
        monthsMap[monthKey] += Number(tx.amount)
      }
    }

    return Object.entries(monthsMap).map(([month, amount]) => ({
      month,
      amount
    }))
  }

  async getBudgetStatus(userId: number) {
    const budgets = await this.budgetsRepository.find({
      where: { userId }
    })

    const actualSpending = await this.getSpendingSummary(userId)
    const spentMap = new Map(actualSpending.map((s) => [s.category, s.amount]))

    const result = budgets.map((b) => {
      const spent = spentMap.get(b.category) || 0
      spentMap.delete(b.category) // Remove so we can check remaining unbudgeted spend
      return {
        id: b.id,
        category: b.category,
        limit: Number(b.monthlyLimit),
        spent
      }
    })

    // Add unbudgeted categories that had spending
    spentMap.forEach((spent, category) => {
      result.push({
        id: 0,
        category,
        limit: 0,
        spent
      })
    })

    return result
  }
}
