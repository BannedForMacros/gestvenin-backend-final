// src/requerimientos/requerimientos.module.ts
import { Module } from '@nestjs/common';
import { RequerimientosService } from './requerimientos.service';
import { RequerimientosController } from './requerimientos.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RequerimientosController],
  providers: [RequerimientosService],
  exports: [RequerimientosService],
})
export class RequerimientosModule {}
