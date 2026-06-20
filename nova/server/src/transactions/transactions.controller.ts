import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { TransactionsService } from './transactions.service'

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get transactions for a specific account' })
  @ApiQuery({ name: 'account', required: true, description: 'Account number' })
  getTransactions(
    @Query('account') account: string,
    @CurrentUser('userId') userId: number
  ) {
    return this.transactionsService.findByAccount(account, userId)
  }
}
