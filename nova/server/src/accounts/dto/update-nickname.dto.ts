import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

export class UpdateNicknameDto {
  @ApiProperty({ example: 'My New Nickname' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  nickname: string
}
