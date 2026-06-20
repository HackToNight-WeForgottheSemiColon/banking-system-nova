import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'user_id' })
  userId: number

  @Column()
  category: string

  @Column({ name: 'monthly_limit', type: 'numeric', precision: 14, scale: 2 })
  monthlyLimit: number
}
