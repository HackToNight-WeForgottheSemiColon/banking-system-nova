import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn
} from 'typeorm'

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  event: string

  @Column({ type: 'jsonb', default: '{}' })
  payload: Record<string, unknown>

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date
}
