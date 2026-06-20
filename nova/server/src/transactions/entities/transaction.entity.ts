import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'from_account' })
  fromAccount: string

  @Column({ name: 'to_account' })
  toAccount: string

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  amount: number

  @Column({ nullable: true })
  description: string

  @Column({ default: 'SUCCESS' })
  status: string

  @Column({ default: 'Others' })
  category: string

  @Column({ name: 'created_by', nullable: true })
  createdBy: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
