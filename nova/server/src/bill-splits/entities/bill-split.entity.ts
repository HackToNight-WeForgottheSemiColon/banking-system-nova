import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('bill_splits')
export class BillSplit {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'requester_id' })
  requesterId: number

  @Column({ name: 'payer_id' })
  payerId: number

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number

  @Column()
  description: string

  @Column({ default: 'pending' })
  status: 'pending' | 'approved' | 'declined'

  @Column({ name: 'transaction_id', type: 'integer', nullable: true })
  transactionId: number | null

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
