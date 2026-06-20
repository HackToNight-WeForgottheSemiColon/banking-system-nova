import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreateBudgetDto } from './dto/create-budget.dto'
import { Budget } from './entities/budget.entity'

@Injectable()
export class BudgetsService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetsRepository: Repository<Budget>
  ) {}

  async findAll(userId: number): Promise<Budget[]> {
    return this.budgetsRepository.find({
      where: { userId }
    })
  }

  async createOrUpdate(userId: number, dto: CreateBudgetDto): Promise<Budget> {
    let budget = await this.budgetsRepository.findOne({
      where: { userId, category: dto.category }
    })

    if (budget) {
      budget.monthlyLimit = dto.monthlyLimit
    } else {
      budget = this.budgetsRepository.create({
        userId,
        category: dto.category,
        monthlyLimit: dto.monthlyLimit
      })
    }

    return this.budgetsRepository.save(budget)
  }

  async remove(userId: number, id: number): Promise<void> {
    const budget = await this.budgetsRepository.findOne({
      where: { id, userId }
    })

    if (!budget) {
      throw new NotFoundException('Budget not found or does not belong to you.')
    }

    await this.budgetsRepository.remove(budget)
  }
}
