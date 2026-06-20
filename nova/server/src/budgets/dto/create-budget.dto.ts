import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator'

export class CreateBudgetDto {
  @ApiProperty({ example: 'Food' })
  @IsString()
  @IsNotEmpty()
  category: string

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  monthlyLimit: number
}
