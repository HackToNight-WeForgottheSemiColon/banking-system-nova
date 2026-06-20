import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'

@Entity('scheduled_transfers')
export class ScheduledTransfer {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column({ name: 'from_account' })
  fromAccount: string

  @Column({ name: 'to_account' })
  toAccount: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number

  @Column({ default: '' })
  description: string

  @Column()
  frequency: string // 'daily' | 'weekly' | 'monthly'

  @Column({ name: 'next_run', type: 'timestamp' })
  nextRun: Date

  @Column({ default: true })
  active: boolean

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
