import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Payee } from './entities/payee.entity'
import { PayeesController } from './payees.controller'
import { PayeesService } from './payees.service'

@Module({
  imports: [TypeOrmModule.forFeature([Payee])],
  controllers: [PayeesController],
  providers: [PayeesService],
  exports: [PayeesService]
})
export class PayeesModule {}
