import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Budget } from '../budgets/entities/budget.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction, Budget])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService]
})
export class AiModule {}
