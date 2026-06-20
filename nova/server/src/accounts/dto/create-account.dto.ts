import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches
} from 'class-validator'

export class CreateAccountDto {
  @ApiProperty({ example: '1000009999' })
  @IsString()
  @IsNotEmpty()
  @Length(8, 20)
  @Matches(/^\d+$/, { message: 'Account number must contain only digits.' })
  accountNumber: string

  @ApiProperty({ example: 'My Savings Account' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  accountName: string

  @ApiPropertyOptional({ example: '1234' })
  @IsString()
  @IsOptional()
  @Length(4, 4)
  @Matches(/^\d{4}$/, { message: 'PIN must be exactly 4 digits.' })
  pin?: string
}
