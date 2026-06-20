import { Body, Controller, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { TransferDto } from './dto/transfer.dto'
import { TransferService } from './transfer.service'

@ApiTags('Transfer')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transfer')
export class TransferController {
  constructor(private readonly transferService: TransferService) {}

  @Post()
  @ApiOperation({ summary: 'Execute a bank transfer between accounts' })
  executeTransfer(
    @Body() transferDto: TransferDto,
    @CurrentUser('userId') userId: number
  ) {
    return this.transferService.execute(transferDto, userId)
  }
}
