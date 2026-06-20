import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CreatePayeeDto } from './dto/create-payee.dto'
import { Payee } from './entities/payee.entity'

@Injectable()
export class PayeesService {
  constructor(
    @InjectRepository(Payee)
    private readonly payeesRepository: Repository<Payee>
  ) {}

  async findAll(userId: number): Promise<Payee[]> {
    return this.payeesRepository.find({
      where: { userId },
      order: { name: 'ASC' }
    })
  }

  async create(userId: number, dto: CreatePayeeDto): Promise<Payee> {
    // Avoid duplicate payees with same account number for this user
    let payee = await this.payeesRepository.findOne({
      where: { userId, accountNumber: dto.accountNumber }
    })

    if (!payee) {
      payee = this.payeesRepository.create({
        userId,
        name: dto.name,
        accountNumber: dto.accountNumber,
        bank: dto.bank
      })
      return this.payeesRepository.save(payee)
    }

    return payee
  }

  async remove(userId: number, id: number): Promise<void> {
    const payee = await this.payeesRepository.findOne({
      where: { id, userId }
    })

    if (!payee) {
      throw new NotFoundException('Saved payee not found.')
    }

    await this.payeesRepository.remove(payee)
  }
}
