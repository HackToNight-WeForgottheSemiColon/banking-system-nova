import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CreateCardDto } from './dto/create-card.dto'
import { VirtualCardsService } from './virtual-cards.service'

@ApiTags('Virtual Cards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('virtual-cards')
export class VirtualCardsController {
  constructor(private readonly virtualCardsService: VirtualCardsService) {}

  @Post()
  @ApiOperation({ summary: 'Generate a new virtual debit/credit card' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateCardDto
  ) {
    const card = await this.virtualCardsService.create(userId, dto)
    return {
      ok: true,
      message: 'Virtual card generated successfully.',
      data: card
    }
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve all virtual cards for the logged-in user'
  })
  async findAll(@CurrentUser('userId') userId: number) {
    const cards = await this.virtualCardsService.findByUserId(userId)
    return {
      ok: true,
      data: cards
    }
  }

  @Patch(':id/toggle-freeze')
  @ApiOperation({ summary: 'Toggle freeze/unfreeze card status' })
  async toggleFreeze(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) cardId: number
  ) {
    const card = await this.virtualCardsService.toggleFreeze(userId, cardId)
    return {
      ok: true,
      message: `Card has been ${card.isFrozen ? 'frozen' : 'unfrozen'} successfully.`,
      data: card
    }
  }

  @Patch(':id/limit')
  @ApiOperation({ summary: 'Update daily spending limit on virtual card' })
  async updateLimit(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) cardId: number,
    @Body('limit') limit: number
  ) {
    const card = await this.virtualCardsService.updateLimit(
      userId,
      cardId,
      limit
    )
    return {
      ok: true,
      message: 'Daily spending limit updated successfully.',
      data: card
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate and delete virtual card' })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) cardId: number
  ) {
    await this.virtualCardsService.remove(userId, cardId)
    return {
      ok: true,
      message: 'Virtual card deactivated and deleted successfully.'
    }
  }
}
