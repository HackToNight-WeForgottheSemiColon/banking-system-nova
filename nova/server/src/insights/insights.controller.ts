import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { InsightsService } from './insights.service'

@ApiTags('Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Get('spending-summary')
  @ApiOperation({ summary: 'Get current month spending grouped by category' })
  async getSpendingSummary(@CurrentUser('userId') userId: number) {
    const data = await this.insightsService.getSpendingSummary(userId)
    return { ok: true, data }
  }

  @Get('trends')
  @ApiOperation({
    summary: 'Get monthly spending trends over the last 6 months'
  })
  async getTrends(@CurrentUser('userId') userId: number) {
    const data = await this.insightsService.getTrends(userId)
    return { ok: true, data }
  }

  @Get('budgets')
  @ApiOperation({
    summary: 'Get budget limit versus actual spent for all categories'
  })
  async getBudgets(@CurrentUser('userId') userId: number) {
    const data = await this.insightsService.getBudgetStatus(userId)
    return { ok: true, data }
  }
}
