import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { StatementsController } from './statements.controller'
import { StatementsService } from './statements.service'

@Module({
  imports: [TypeOrmModule.forFeature([Account, Transaction])],
  controllers: [StatementsController],
  providers: [StatementsService],
  exports: [StatementsService]
})
export class StatementsModule {}
