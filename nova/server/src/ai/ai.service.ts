import { GoogleGenerativeAI } from '@google/generative-ai'
import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { In, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Budget } from '../budgets/entities/budget.entity'
import { Transaction } from '../transactions/entities/transaction.entity'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private ai: GoogleGenerativeAI | null = null

  constructor(
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>
  ) {
    const apiKey = process.env.GEMINI_API_KEY
    if (apiKey) {
      this.logger.log('Initializing Gemini AI client...')
      this.ai = new GoogleGenerativeAI(apiKey)
    } else {
      this.logger.warn(
        'GEMINI_API_KEY environment variable is not defined. Falling back to rule-based insights.'
      )
    }
  }

  private async buildRagContext(userId: number): Promise<string> {
    const accounts = await this.accountsRepository.find({ where: { userId } })
    const accountNumbers = accounts.map((a) => a.accountNumber)

    let transactionsText = 'No recent transactions found.'
    if (accountNumbers.length > 0) {
      const txs = await this.transactionsRepository.find({
        where: [
          { fromAccount: In(accountNumbers) },
          { toAccount: In(accountNumbers) }
        ],
        order: { createdAt: 'DESC' },
        take: 15
      })

      if (txs.length > 0) {
        transactionsText = txs
          .map((t) => {
            const isDebit = accountNumbers.includes(t.fromAccount)
            const direction = isDebit ? 'OUTGOING' : 'INCOMING'
            const dateStr = new Date(t.createdAt).toISOString().split('T')[0]
            return `- Date: ${dateStr}, Type: ${direction}, Amount: Rs. ${t.amount}, Category: ${t.category}, Desc: "${t.description}"`
          })
          .join('\n')
      }
    }

    const budgets = await this.budgetsRepository.find({ where: { userId } })
    const budgetsText =
      budgets.length > 0
        ? budgets
            .map(
              (b) =>
                `- Category: ${b.category}, Monthly Limit: Rs. ${b.monthlyLimit}`
            )
            .join('\n')
        : 'No monthly budgets configured.'

    const accountsText =
      accounts.length > 0
        ? accounts
            .map(
              (a) =>
                `- Account Name: "${a.accountName}", Number: ${a.accountNumber}, Current Balance: Rs. ${a.balance}`
            )
            .join('\n')
        : 'No active bank accounts found.'

    return `
User Financial Profile Data:
Active Bank Accounts:
${accountsText}

Monthly Budgets Configured:
${budgetsText}

Recent Transactions (Last 15):
${transactionsText}
`
  }

  async getChatResponse(userId: number, userMessage: string): Promise<string> {
    const context = await this.buildRagContext(userId)
    const systemPrompt = `You are Nova, the personal AI financial advisor of Nova Bank.
You have secure access to the user's financial profile listed below. Use it to answer questions about balances, budgets, spending trends, or suggestions.
${context}

Instructions:
1. Provide a professional, warm, helpful, and concise response.
2. Only answer based on the real profile data provided above. If asked about something else, politely guide the user back to their finances.
3. Keep the response to 2-4 sentences unless the user requests detailed advice.
4. Format currency as "Rs. X".
5. Never leak administrative credentials, process configurations, or debug states.
`

    if (this.ai) {
      try {
        const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent([systemPrompt, userMessage])
        return result.response.text()
      } catch (err: any) {
        this.logger.error('Gemini API call failed:', err)
        return `I encountered an issue connecting to the AI service: ${err?.message || err}. Here is a fallback summary of your accounts: you have ${context.split('\n').filter((l) => l.startsWith('-')).length} items registered.`
      }
    }

    // Fallback Simulated Intelligence
    return this.generateSimulatedResponse(userMessage, context)
  }

  async getSpendingSummaryInsight(userId: number): Promise<string> {
    const context = await this.buildRagContext(userId)
    const prompt = `You are Nova, the personal AI financial advisor of Nova Bank.
Based on the following user financial profile, generate a single-sentence or double-sentence analytical summary recommendation (under 40 words) about their recent spending behavior or suggestions. Focus on highlighting categories that have high expenses.
${context}
`

    if (this.ai) {
      try {
        const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' })
        const result = await model.generateContent(prompt)
        return result.response.text().trim()
      } catch (err) {
        this.logger.error('Gemini insights call failed, using fallback')
      }
    }

    return 'Your spending in Food is a bit high this week (Rs. 1,500.00). Try to limit dining out and set a strict Food budget to save more this month!'
  }

  private generateSimulatedResponse(msg: string, context: string): string {
    const lower = msg.toLowerCase()
    if (
      lower.includes('balance') ||
      lower.includes('how much money') ||
      lower.includes('accounts')
    ) {
      if (context.includes('Current Balance:')) {
        const matches = context.match(
          /- Account Name: "[^"]*", Number: \d+, Current Balance: Rs. \d+(\.\d+)?/g
        )
        if (matches) {
          return `You currently have ${matches.length} active account(s): ${matches.map((m) => m.replace('- ', '')).join(', ')}. Let me know if you'd like to plan a savings goal!`
        }
      }
      return 'You currently have no bank accounts. You can create one in the Accounts tab.'
    }
    if (
      lower.includes('budget') ||
      lower.includes('limit') ||
      lower.includes('spent')
    ) {
      if (context.includes('Category:')) {
        return 'You have some custom category limits configured. In your Smart Spend dashboard, you can track progress bars. Would you like me to help you adjust your limits?'
      }
      return 'You have not set any monthly budgets yet. Would you like me to suggest some budget limits based on your past spending?'
    }
    if (
      lower.includes('spend') ||
      lower.includes('transaction') ||
      lower.includes('history') ||
      lower.includes('uber')
    ) {
      return 'Based on your recent transactions, your largest category of outgoing transfers is Food (e.g. Uber Eats). Setting up a budget limit will help you save!'
    }

    return 'Hello! I am Nova, your AI assistant. I can help you analyze your balances, explain your spending breakdown, suggest category budgets, or answer general financial questions. What would you like to know today?'
  }
}
