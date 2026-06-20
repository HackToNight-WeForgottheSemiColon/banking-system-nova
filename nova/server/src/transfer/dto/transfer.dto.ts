import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min
} from 'class-validator'

export class TransferDto {
  @ApiPropertyOptional({ example: '1000003423' })
  @IsString()
  @IsOptional()
  fromAccount?: string

  @ApiProperty({ example: '2000006754' })
  @IsString()
  @IsNotEmpty()
  toAccount: string

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0.01)
  amount: number

  @ApiPropertyOptional({ example: 'Lunch money' })
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cardNumber?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  cardId?: number
}
