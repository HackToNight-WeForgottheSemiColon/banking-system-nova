import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './entities/user.entity'

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  findById(id: number) {
    return this.usersRepository.findOne({ where: { id } })
  }

  findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } })
  }

  findAll() {
    return this.usersRepository.find({
      select: [
        'id',
        'username',
        'role',
        'fullName',
        'nic',
        'email',
        'avatarUrl',
        'createdAt'
      ],
      order: { id: 'ASC' }
    })
  }

  async updateProfile(
    userId: number,
    data: {
      fullName?: string
      email?: string
      nic?: string
      avatarUrl?: string
    }
  ) {
    await this.usersRepository.update(userId, data)
    return this.findById(userId)
  }
}
