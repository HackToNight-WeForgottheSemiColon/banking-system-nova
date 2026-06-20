import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreatePayeeDto {
  @ApiProperty({ example: 'Kasun Wickramanayake' })
  @IsString()
  @IsNotEmpty()
  name: string

  @ApiProperty({ example: '2000006754' })
  @IsString()
  @IsNotEmpty()
  accountNumber: string

  @ApiProperty({ example: 'Nova Bank' })
  @IsString()
  @IsNotEmpty()
  bank: string
}
