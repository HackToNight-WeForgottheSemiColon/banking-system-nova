import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator'

export class CreateSavingsJarDto {
  @ApiProperty()
  @IsString()
  name: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  targetAmount: number

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  roundUpEnabled?: boolean

  @ApiPropertyOptional({ enum: [50, 100], default: 100 })
  @IsOptional()
  @IsIn([50, 100])
  roundUpRule?: number
}

export class UpdateSavingsJarDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  targetAmount?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  roundUpEnabled?: boolean

  @ApiPropertyOptional({ enum: [50, 100] })
  @IsOptional()
  @IsIn([50, 100])
  roundUpRule?: number
}

export class SavingsTransactionDto {
  @ApiProperty()
  @IsString()
  accountNumber: string

  @ApiProperty()
  @IsNumber()
  @Min(1)
  amount: number
}
