import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { TransferModule } from '../transfer/transfer.module'
import { User } from '../users/entities/user.entity'
import { BillSplitsController } from './bill-splits.controller'
import { BillSplitsService } from './bill-splits.service'
import { BillSplit } from './entities/bill-split.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([BillSplit, User, Account]),
    NotificationsModule,
    TransferModule
  ],
  controllers: [BillSplitsController],
  providers: [BillSplitsService],
  exports: [BillSplitsService]
})
export class BillSplitsModule {}
