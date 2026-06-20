import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Account } from '../accounts/entities/account.entity'
import { NotificationsModule } from '../notifications/notifications.module'
import { SavingsJar } from './entities/savings-jar.entity'
import { SavingsJarsController } from './savings-jars.controller'
import { SavingsJarsService } from './savings-jars.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([SavingsJar, Account]),
    NotificationsModule
  ],
  controllers: [SavingsJarsController],
  providers: [SavingsJarsService],
  exports: [SavingsJarsService]
})
export class SavingsJarsModule {}
