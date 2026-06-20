import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { Response } from 'express'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { StatementsService } from './statements.service'

@ApiTags('Statements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statements')
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}

  @Get('pdf')
  @ApiOperation({
    summary: 'Download PDF statement for a specific bank account'
  })
  @ApiQuery({ name: 'account', required: true, description: 'Account number' })
  async getStatementPdf(
    @Query('account') account: string,
    @CurrentUser('userId') userId: number,
    @Res() res: Response
  ) {
    return this.statementsService.generateStatementPdf(account, userId, res)
  }
}
