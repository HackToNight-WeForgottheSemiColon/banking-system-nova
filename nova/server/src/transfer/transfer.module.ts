import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { AuditLog } from '../admin/entities/audit-log.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { SavingsJarsModule } from '../savings-jars/savings-jars.module'
import { Transaction } from '../transactions/entities/transaction.entity'
import { VirtualCardsModule } from '../virtual-cards/virtual-cards.module'
import { TransferController } from './transfer.controller'
import { TransferService } from './transfer.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Transaction, AuditLog]),
    NotificationsModule,
    VirtualCardsModule,
    SavingsJarsModule
  ],
  controllers: [TransferController],
  providers: [TransferService],
  exports: [TransferService]
})
export class TransferModule {}
