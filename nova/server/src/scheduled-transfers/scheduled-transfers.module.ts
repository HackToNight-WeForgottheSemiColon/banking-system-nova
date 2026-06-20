import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { TransferModule } from '../transfer/transfer.module'
import { ScheduledTransfer } from './entities/scheduled-transfer.entity'
import { ScheduledTransfersController } from './scheduled-transfers.controller'
import { ScheduledTransfersService } from './scheduled-transfers.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledTransfer, Account]),
    TransferModule,
    NotificationsModule
  ],
  controllers: [ScheduledTransfersController],
  providers: [ScheduledTransfersService],
  exports: [ScheduledTransfersService]
})
export class ScheduledTransfersModule {}
