import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { AccountsService } from '../accounts/accounts.service'
import { MailService } from '../mail/mail.service'
import { User } from '../users/entities/user.entity'
import { LoginDto } from './dto/login.dto'
import { RegisterDto } from './dto/register.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'

const SALT_ROUNDS = 12

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private accountsService: AccountsService,
    private mailService: MailService
  ) {}

  async login(dto: LoginDto) {
    // Explicitly select password since it's excluded by default
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.username = :username', { username: dto.username })
      .getOne()

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password)
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials.')
    }

    const token = this.signToken(user)

    return {
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    }
  }

  async register(dto: RegisterDto) {
    // Check username uniqueness
    const existing = await this.usersRepository.findOne({
      where: { username: dto.username }
    })
    if (existing) {
      throw new ConflictException('Username already taken.')
    }

    // Verify account number is unique in accounts table
    const accountExists = await this.accountsService.findByAccountNumber(
      dto.username
    )
    if (accountExists) {
      throw new ConflictException(
        'This account number is already registered in the system.'
      )
    }

    const hashedPassword = await bcrypt.hash(dto.password, SALT_ROUNDS)

    const user = this.usersRepository.create({
      username: dto.username,
      password: hashedPassword,
      fullName: dto.fullName,
      nic: dto.nic,
      email: dto.email,
      role: 'customer'
    })

    const saved = await this.usersRepository.save(user)

    // Create the default bank account for the user matching the account number
    await this.accountsService.create(
      saved.id,
      saved.username,
      `${saved.fullName} Savings`
    )

    // Send Welcome Email
    try {
      await this.mailService.sendWelcomeEmail(
        saved.email,
        saved.fullName,
        saved.username
      )
    } catch (mailErr) {
      console.error('Failed to send welcome email:', mailErr)
    }

    const token = this.signToken(saved)

    return {
      ok: true,
      token,
      user: {
        id: saved.id,
        username: saved.username,
        role: saved.role,
        fullName: saved.fullName,
        email: saved.email,
        avatarUrl: saved.avatarUrl
      }
    }
  }

  async getUserProfile(userId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } })
    if (!user) {
      throw new UnauthorizedException('User not found.')
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email }
    })
    if (!user) {
      throw new NotFoundException('User with this email not found.')
    }

    if (!/^\d{6}$/.test(dto.otp)) {
      throw new BadRequestException('Invalid OTP format. Must be 6 digits.')
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, SALT_ROUNDS)

    // Update password
    await this.usersRepository.update(user.id, { password: hashedPassword })

    // Send Password Reset Success Email
    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.fullName)
    } catch (mailErr) {
      console.error('Failed to send password reset email:', mailErr)
    }

    return {
      ok: true,
      message: 'Password reset successfully.'
    }
  }

  private signToken(user: User): string {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role
    }
    return this.jwtService.sign(payload)
  }
}
