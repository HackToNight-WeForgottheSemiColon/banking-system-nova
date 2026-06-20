import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Between, Repository } from 'typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { User } from '../users/entities/user.entity'
import { VirtualCard } from './entities/virtual-card.entity'

@Injectable()
export class VirtualCardsService {
  constructor(
    @InjectRepository(VirtualCard)
    private readonly virtualCardsRepository: Repository<VirtualCard>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>
  ) {}

  async create(
    userId: number,
    dto: {
      accountId: number
      cardType: 'debit' | 'credit'
      dailyLimit?: number
    }
  ): Promise<VirtualCard> {
    // Verify user exists
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new NotFoundException('User not found.')
    }

    // Verify account exists and belongs to user
    const account = await this.accountsRepository.findOne({
      where: { id: dto.accountId, userId }
    })
    if (!account) {
      throw new NotFoundException(
        'Linked bank account not found or does not belong to you.'
      )
    }

    // Generate random 16-digit card number (starting with 4 for Visa)
    let cardNumber = '4'
    for (let i = 0; i < 15; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString()
    }

    // Generate random CVV
    const cvv = Math.floor(100 + Math.random() * 900).toString()

    // Expiry date (5 years from now)
    const expiryYear = (new Date().getFullYear() + 5).toString().slice(-2)
    const expiryMonth = String(new Date().getMonth() + 1).padStart(2, '0')
    const expiryDate = `${expiryMonth}/${expiryYear}`

    const card = this.virtualCardsRepository.create({
      userId,
      accountId: dto.accountId,
      cardNumber,
      cardholderName: user.fullName.toUpperCase(),
      expiryDate,
      cvv,
      cardType: dto.cardType,
      dailyLimit: dto.dailyLimit || 50000.0,
      isFrozen: false
    })

    return this.virtualCardsRepository.save(card)
  }

  async findByUserId(userId: number): Promise<VirtualCard[]> {
    return this.virtualCardsRepository.find({
      where: { userId },
      order: { id: 'DESC' }
    })
  }

  async findById(userId: number, cardId: number): Promise<VirtualCard> {
    const card = await this.virtualCardsRepository.findOne({
      where: { id: cardId, userId }
    })
    if (!card) {
      throw new NotFoundException('Virtual card not found.')
    }
    return card
  }

  async toggleFreeze(userId: number, cardId: number): Promise<VirtualCard> {
    const card = await this.findById(userId, cardId)
    card.isFrozen = !card.isFrozen
    return this.virtualCardsRepository.save(card)
  }

  async updateLimit(
    userId: number,
    cardId: number,
    limit: number
  ): Promise<VirtualCard> {
    if (limit <= 0) {
      throw new BadRequestException('Daily limit must be a positive number.')
    }
    const card = await this.findById(userId, cardId)
    card.dailyLimit = limit
    return this.virtualCardsRepository.save(card)
  }

  async remove(userId: number, cardId: number): Promise<void> {
    const card = await this.findById(userId, cardId)
    await this.virtualCardsRepository.remove(card)
  }

  async validateCardUsage(
    cardNumber: string,
    amount: number
  ): Promise<Account> {
    const card = await this.virtualCardsRepository.findOne({
      where: { cardNumber }
    })
    if (!card) {
      throw new BadRequestException('Virtual card number is invalid.')
    }

    if (card.isFrozen) {
      throw new BadRequestException('Transaction declined: Card is frozen.')
    }

    // Calculate how much was spent today using this card
    const last4 = card.cardNumber.slice(-4)

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)

    // Fetch the account to get its number
    const account = await this.accountsRepository.findOne({
      where: { id: card.accountId }
    })
    if (!account) {
      throw new NotFoundException('Account linked to card not found.')
    }

    // Fetch transactions today with Card: XXXX in description
    const transactions = await this.transactionsRepository.find({
      where: {
        fromAccount: account.accountNumber,
        createdAt: Between(startOfToday, endOfToday)
      }
    })

    const cardSpentToday = transactions
      .filter((tx) => (tx.description || '').includes(`Card: ${last4}`))
      .reduce((sum, tx) => sum + Number(tx.amount), 0)

    if (cardSpentToday + amount > Number(card.dailyLimit)) {
      throw new BadRequestException(
        `Transaction declined: Exceeds daily card limit. Spent today: Rs. ${cardSpentToday.toLocaleString()}. Remaining limit: Rs. ${(Number(card.dailyLimit) - cardSpentToday).toLocaleString()}.`
      )
    }

    return account
  }
}
