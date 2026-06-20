import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, MinLength } from 'class-validator'

export class LoginDto {
  @ApiProperty({ example: 'dilara' })
  @IsString()
  @IsNotEmpty()
  username: string

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(1)
  password: string
}
