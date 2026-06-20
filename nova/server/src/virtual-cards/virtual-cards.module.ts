import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { User } from '../users/entities/user.entity'
import { VirtualCard } from './entities/virtual-card.entity'
import { VirtualCardsController } from './virtual-cards.controller'
import { VirtualCardsService } from './virtual-cards.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([VirtualCard, User, Account, Transaction])
  ],
  controllers: [VirtualCardsController],
  providers: [VirtualCardsService],
  exports: [VirtualCardsService]
})
export class VirtualCardsModule {}
