import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AccountsModule } from './accounts/accounts.module'
import { Account } from './accounts/entities/account.entity'
import { AdminModule } from './admin/admin.module'
import { AiModule } from './ai/ai.module'
// Import modules
import { AuthModule } from './auth/auth.module'
import { BillSplitsModule } from './bill-splits/bill-splits.module'
import { BillSplit } from './bill-splits/entities/bill-split.entity'
import { BudgetsModule } from './budgets/budgets.module'
import { Budget } from './budgets/entities/budget.entity'
import { databaseConfig } from './config/database.config'
import { SeedService } from './config/seed.service'
import { HealthModule } from './health/health.module'
import { InsightsModule } from './insights/insights.module'
import { MailModule } from './mail/mail.module'
import { Notification } from './notifications/entities/notification.entity'
import { NotificationsModule } from './notifications/notifications.module'
import { Payee } from './payees/entities/payee.entity'
import { PayeesModule } from './payees/payees.module'
import { SavingsJar } from './savings-jars/entities/savings-jar.entity'
import { SavingsJarsModule } from './savings-jars/savings-jars.module'
import { ScheduledTransfer } from './scheduled-transfers/entities/scheduled-transfer.entity'
import { ScheduledTransfersModule } from './scheduled-transfers/scheduled-transfers.module'
import { SearchModule } from './search/search.module'
import { StatementsModule } from './statements/statements.module'
import { Transaction } from './transactions/entities/transaction.entity'
import { TransactionsModule } from './transactions/transactions.module'
import { TransferModule } from './transfer/transfer.module'
// Import entities for Seeding
import { User } from './users/entities/user.entity'
import { UsersModule } from './users/users.module'
import { VirtualCard } from './virtual-cards/entities/virtual-card.entity'
import { VirtualCardsModule } from './virtual-cards/virtual-cards.module'

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig()),
    TypeOrmModule.forFeature([
      User,
      Account,
      Transaction,
      Budget,
      Notification,
      Payee,
      ScheduledTransfer,
      VirtualCard,
      BillSplit,
      SavingsJar
    ]),
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    TransferModule,
    SearchModule,
    AdminModule,
    HealthModule,
    BudgetsModule,
    InsightsModule,
    AiModule,
    NotificationsModule,
    PayeesModule,
    StatementsModule,
    ScheduledTransfersModule,
    MailModule,
    VirtualCardsModule,
    BillSplitsModule,
    SavingsJarsModule
  ],
  providers: [SeedService]
})
export class AppModule {}
