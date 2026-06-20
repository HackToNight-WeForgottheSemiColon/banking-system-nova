import { ApiProperty } from '@nestjs/swagger'
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString
} from 'class-validator'

export class CreateScheduledTransferDto {
  @ApiProperty({ example: '1234567890' })
  @IsNotEmpty()
  @IsString()
  fromAccount: string

  @ApiProperty({ example: '0987654321' })
  @IsNotEmpty()
  @IsString()
  toAccount: string

  @ApiProperty({ example: 500.0 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  amount: number

  @ApiProperty({ example: 'Monthly allowance', required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ example: 'monthly', enum: ['daily', 'weekly', 'monthly'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly'])
  frequency: string

  @ApiProperty({ example: '2026-06-25T12:00:00.000Z' })
  @IsNotEmpty()
  @IsString()
  startDate: string
}
