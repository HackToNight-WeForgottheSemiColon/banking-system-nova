import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import { Account } from '../../accounts/entities/account.entity'

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  username: string

  @Column({ select: false })
  password: string

  @Column({ default: 'customer' })
  role: string

  @Column({ name: 'full_name' })
  fullName: string

  @Column({ nullable: true })
  nic: string

  @Column({ nullable: true })
  email: string

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @OneToMany(
    () => Account,
    (account) => account.user
  )
  accounts: Account[]
}
