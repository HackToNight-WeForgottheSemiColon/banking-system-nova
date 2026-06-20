import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import {
  CreateSavingsJarDto,
  SavingsTransactionDto,
  UpdateSavingsJarDto
} from './dto/savings-jar.dto'
import { SavingsJarsService } from './savings-jars.service'

@ApiTags('Savings Jars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('savings-jars')
export class SavingsJarsController {
  constructor(private readonly savingsJarsService: SavingsJarsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new savings jar goal' })
  async create(
    @CurrentUser('userId') userId: number,
    @Body() dto: CreateSavingsJarDto
  ) {
    const jar = await this.savingsJarsService.create(userId, dto)
    return {
      ok: true,
      message: 'Savings jar created successfully.',
      data: jar
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all savings jars for the logged-in user' })
  async findAll(@CurrentUser('userId') userId: number) {
    const jars = await this.savingsJarsService.findAll(userId)
    return {
      ok: true,
      data: jars
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific savings jar' })
  async findOne(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) jarId: number
  ) {
    const jar = await this.savingsJarsService.findOne(userId, jarId)
    return {
      ok: true,
      data: jar
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update settings or preferences on a savings jar' })
  async update(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) jarId: number,
    @Body() dto: UpdateSavingsJarDto
  ) {
    const jar = await this.savingsJarsService.update(userId, jarId, dto)
    return {
      ok: true,
      message: 'Savings jar settings updated successfully.',
      data: jar
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate and delete a savings jar, refunding funds'
  })
  @ApiQuery({
    name: 'refundAccount',
    required: false,
    description: 'Bank account number to send remaining funds'
  })
  async remove(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) jarId: number,
    @Query('refundAccount') refundAccount?: string
  ) {
    const result = await this.savingsJarsService.delete(
      userId,
      jarId,
      refundAccount || ''
    )
    return {
      ok: true,
      message: `Savings jar deleted successfully. Refunded Rs. ${result.refunded.toLocaleString('en-US')}.`,
      refunded: result.refunded
    }
  }

  @Post(':id/deposit')
  @ApiOperation({
    summary: 'Manually transfer money from a bank account to a savings jar'
  })
  async deposit(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) jarId: number,
    @Body() dto: SavingsTransactionDto
  ) {
    const jar = await this.savingsJarsService.deposit(
      userId,
      jarId,
      dto.accountNumber,
      dto.amount
    )
    return {
      ok: true,
      message: `Deposited Rs. ${dto.amount.toLocaleString()} successfully.`,
      data: jar
    }
  }

  @Post(':id/withdraw')
  @ApiOperation({
    summary: 'Manually transfer money from a savings jar back to a bank account'
  })
  async withdraw(
    @CurrentUser('userId') userId: number,
    @Param('id', ParseIntPipe) jarId: number,
    @Body() dto: SavingsTransactionDto
  ) {
    const jar = await this.savingsJarsService.withdraw(
      userId,
      jarId,
      dto.accountNumber,
      dto.amount
    )
    return {
      ok: true,
      message: `Withdrew Rs. ${dto.amount.toLocaleString()} successfully.`,
      data: jar
    }
  }
}
