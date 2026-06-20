import { TypeOrmModuleOptions } from '@nestjs/typeorm'

export const databaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ||
    'postgresql://postgres:2007@localhost:5432/htn26db',
  autoLoadEntities: true,
  synchronize: true, // Auto-create tables in dev — disable in production
  logging: process.env.NODE_ENV !== 'production'
})
