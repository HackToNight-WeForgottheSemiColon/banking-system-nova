import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { Transaction } from '../transactions/entities/transaction.entity'
import { User } from '../users/entities/user.entity'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { AuditLog } from './entities/audit-log.entity'

@Module({
  imports: [TypeOrmModule.forFeature([User, Account, AuditLog, Transaction])],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {}
