import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Budget } from '../budgets/entities/budget.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { InsightsController } from './insights.controller'
import { InsightsService } from './insights.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction, Budget])],
  controllers: [InsightsController],
  providers: [InsightsService],
  exports: [InsightsService]
})
export class InsightsModule {}
