import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Entity('savings_jars')
export class SavingsJar {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column()
  name: string

  @Column({ name: 'target_amount', type: 'numeric', precision: 14, scale: 2 })
  targetAmount: number

  @Column({
    name: 'current_amount',
    type: 'numeric',
    precision: 14,
    scale: 2,
    default: 0
  })
  currentAmount: number

  @Column({ name: 'round_up_enabled', default: false })
  roundUpEnabled: boolean

  @Column({ name: 'round_up_rule', type: 'integer', default: 100 }) // nearest 50 or 100
  roundUpRule: number

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date
}
