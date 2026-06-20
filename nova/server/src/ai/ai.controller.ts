import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AiService } from './ai.service'

class ChatDto {
  @IsNotEmpty()
  @IsString()
  message: string
}

@ApiTags('AI')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send message to Nova AI financial advisor' })
  async chat(@CurrentUser('userId') userId: number, @Body() dto: ChatDto) {
    const response = await this.aiService.getChatResponse(userId, dto.message)
    return { ok: true, response }
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get current AI spending insight one-liner' })
  async getInsights(@CurrentUser('userId') userId: number) {
    const summary = await this.aiService.getSpendingSummaryInsight(userId)
    return { ok: true, summary }
  }
}
