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
import { CreateScheduledTransferDto } from './dto/create-scheduled-transfer.dto'
import { ScheduledTransfersService } from './scheduled-transfers.service'

@ApiTags('Scheduled Transfers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('scheduled-transfers')
export class ScheduledTransfersController {
  constructor(
    private readonly scheduledTransfersService: ScheduledTransfersService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all scheduled transfers for current user' })
  async getScheduledTransfers(@CurrentUser('userId') userId: number) {
    const data = await this.scheduledTransfersService.findAll(userId)
    return { ok: true, data }
  }

  @Post()
  @ApiOperation({ summary: 'Create a new recurring scheduled transfer' })
  async createScheduledTransfer(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateScheduledTransferDto
  ) {
    const data = await this.scheduledTransfersService.create(dto, userId)
    return {
      ok: true,
      message: 'Scheduled transfer created successfully.',
      data
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel/delete a scheduled transfer' })
  async removeScheduledTransfer(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) id: number
  ) {
    await this.scheduledTransfersService.remove(id, userId)
    return { ok: true, message: 'Scheduled transfer cancelled successfully.' }
  }
}
