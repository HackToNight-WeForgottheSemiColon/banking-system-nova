import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { UpdateProfileDto } from './dto/update-profile.dto'
import { S3Service } from './s3.service'
import { UsersService } from './users.service'

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service
  ) {}

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile details' })
  async updateProfile(
    @CurrentUser('userId') userId: number,
    @Body() dto: UpdateProfileDto
  ) {
    const updated = await this.usersService.updateProfile(userId, dto)
    if (!updated) {
      throw new BadRequestException('User not found or update failed.')
    }
    return {
      ok: true,
      message: 'Profile updated successfully.',
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        fullName: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl
      }
    }
  }

  @Post('avatar')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload profile avatar to S3' })
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser('userId') userId: number,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No avatar file provided.')
    }

    // Basic file validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'
      )
    }

    // Limit size to 5MB
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File is too large. Maximum size allowed is 5MB.'
      )
    }

    // Upload to S3
    const avatarUrl = await this.s3Service.uploadFile(file)

    // Update user profile image in db
    const updated = await this.usersService.updateProfile(userId, { avatarUrl })
    if (!updated) {
      throw new BadRequestException('User not found or upload failed.')
    }

    return {
      ok: true,
      message: 'Avatar uploaded successfully.',
      avatarUrl: updated.avatarUrl,
      user: {
        id: updated.id,
        username: updated.username,
        role: updated.role,
        fullName: updated.fullName,
        email: updated.email,
        avatarUrl: updated.avatarUrl
      }
    }
  }
}
