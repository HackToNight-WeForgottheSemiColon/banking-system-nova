import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('virtual_cards')
export class VirtualCard {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column({ name: 'account_id' })
  accountId: number

  @Column({ name: 'card_number', unique: true })
  cardNumber: string

  @Column({ name: 'cardholder_name' })
  cardholderName: string

  @Column({ name: 'expiry_date' })
  expiryDate: string // e.g. "12/30"

  @Column()
  cvv: string // e.g. "123"

  @Column({ name: 'card_type', default: 'debit' })
  cardType: 'debit' | 'credit'

  @Column({ name: 'is_frozen', default: false })
  isFrozen: boolean

  @Column({
    name: 'daily_limit',
    type: 'numeric',
    precision: 12,
    scale: 2,
    default: 50000.0
  })
  dailyLimit: number

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
