import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column()
  type: string // e.g., 'TRANSFER', 'BUDGET_EXCEEDED', 'SYSTEM', 'ANOMALY'

  @Column()
  title: string

  @Column()
  message: string

  @Column({ default: false })
  read: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
