import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { AccountsService } from './accounts.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateNicknameDto } from './dto/update-nickname.dto'

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all accounts for the authenticated user' })
  getMyAccounts(@CurrentUser('userId') userId: number) {
    return this.accountsService.findByUserId(userId)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser('userId') userId: number
  ) {
    return this.accountsService.create(
      userId,
      dto.accountNumber,
      dto.accountName,
      dto.pin
    )
  }

  @Patch(':accountNumber/nickname')
  @ApiOperation({ summary: 'Update account name / nickname' })
  updateNickname(
    @Param('accountNumber') accountNumber: string,
    @Body() dto: UpdateNicknameDto,
    @CurrentUser('userId') userId: number
  ) {
    return this.accountsService.updateNickname(
      accountNumber,
      userId,
      dto.nickname
    )
  }

  @Delete(':accountNumber')
  @ApiOperation({ summary: 'Delete a bank account' })
  removeAccount(
    @Param('accountNumber') accountNumber: string,
    @CurrentUser('userId') userId: number
  ) {
    return this.accountsService.remove(accountNumber, userId)
  }
}
