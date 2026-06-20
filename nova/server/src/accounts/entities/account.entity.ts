import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column({ name: 'account_number', unique: true })
  accountNumber: string

  @Column({ name: 'account_name' })
  accountName: string

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  balance: number

  @Column({ select: false, default: '0000' })
  pin: string

  @ManyToOne(
    () => User,
    (user) => user.accounts
  )
  @JoinColumn({ name: 'user_id' })
  user: User
}
