import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Roles } from '../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { RolesGuard } from '../common/guards/roles.guard'
import { AdminService } from './admin.service'

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('system')
  @ApiOperation({
    summary: 'Get overall system stats, users, accounts and logs (Admin only)'
  })
  async getSystemOverview() {
    const data = await this.adminService.getSystemOverview()
    return {
      ok: true,
      message: 'System overview.',
      ...data
    }
  }

  @Post('users/:id/role')
  @ApiOperation({ summary: 'Update a user role (Admin only)' })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: string
  ) {
    if (!role || (role !== 'admin' && role !== 'customer')) {
      throw new BadRequestException(
        'Invalid role. Role must be admin or customer.'
      )
    }
    try {
      const user = await this.adminService.updateUserRole(id, role)
      return {
        ok: true,
        message: 'User role updated successfully.',
        data: user
      }
    } catch (err: any) {
      throw new BadRequestException(err.message)
    }
  }

  @Post('accounts/:accountNumber/adjust-balance')
  @ApiOperation({ summary: 'Adjust an account balance (Admin only)' })
  async adjustAccountBalance(
    @Param('accountNumber') accountNumber: string,
    @Body('amount') amount: number,
    @Body('action') action: 'set' | 'deposit' | 'withdraw'
  ) {
    if (
      amount === undefined ||
      amount === null ||
      isNaN(amount) ||
      amount < 0
    ) {
      throw new BadRequestException('Amount must be a positive number.')
    }
    if (
      !action ||
      (action !== 'set' && action !== 'deposit' && action !== 'withdraw')
    ) {
      throw new BadRequestException('Action must be set, deposit, or withdraw.')
    }
    try {
      const account = await this.adminService.adjustAccountBalance(
        accountNumber,
        Number(amount),
        action
      )
      return {
        ok: true,
        message: 'Account balance adjusted successfully.',
        data: account
      }
    } catch (err: any) {
      throw new BadRequestException(err.message)
    }
  }
}
