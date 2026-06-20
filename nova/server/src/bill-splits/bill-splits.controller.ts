import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { BillSplitsService } from './bill-splits.service'
import { CreateBillSplitDto } from './dto/create-bill-split.dto'

@ApiTags('Bill Splits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bill-splits')
export class BillSplitsController {
  constructor(private readonly billSplitsService: BillSplitsService) {}

  @Post()
  @ApiOperation({ summary: 'Request a bill split with a friend' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateBillSplitDto
  ) {
    const split = await this.billSplitsService.create(userId, dto)
    return {
      ok: true,
      message: 'Bill split request sent successfully.',
      data: split
    }
  }

  @Get('pending')
  @ApiOperation({
    summary: 'Retrieve pending bill split requests received by the user'
  })
  async findPending(@CurrentUser('userId') userId: number) {
    const splits = await this.billSplitsService.findPendingByPayer(userId)
    return {
      ok: true,
      data: splits
    }
  }

  @Get('my-requests')
  @ApiOperation({ summary: 'Retrieve bill split requests sent by the user' })
  async findMyRequests(@CurrentUser('userId') userId: number) {
    const splits = await this.billSplitsService.findMyRequests(userId)
    return {
      ok: true,
      data: splits
    }
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a bill split request and pay it' })
  async approve(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) splitId: number,
    @Body('fromAccount') fromAccount: string
  ) {
    const split = await this.billSplitsService.approve(
      userId,
      splitId,
      fromAccount
    )
    return {
      ok: true,
      message: 'Bill split request approved and paid successfully.',
      data: split
    }
  }

  @Post(':id/decline')
  @ApiOperation({ summary: 'Decline a bill split request' })
  async decline(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) splitId: number
  ) {
    const split = await this.billSplitsService.decline(userId, splitId)
    return {
      ok: true,
      message: 'Bill split request declined successfully.',
      data: split
    }
  }
}
