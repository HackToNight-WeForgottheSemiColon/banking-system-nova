import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { BudgetsService } from './budgets.service'
import { CreateBudgetDto } from './dto/create-budget.dto'

@ApiTags('Budgets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active category budgets for current user' })
  async getBudgets(@CurrentUser('userId') userId: number) {
    const data = await this.budgetsService.findAll(userId)
    return { ok: true, data }
  }

  @Post()
  @ApiOperation({ summary: 'Create or update budget limit for a category' })
  async createOrUpdateBudget(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateBudgetDto
  ) {
    const data = await this.budgetsService.createOrUpdate(userId, dto)
    return { ok: true, message: 'Budget saved successfully.', data }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category budget' })
  async removeBudget(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.budgetsService.remove(userId, id)
    return { ok: true, message: 'Budget deleted successfully.' }
  }
}
