// src/entradas-central/entradas-central.module.ts
import { Module } from '@nestjs/common';
import { EntradasCentralService } from './entradas-central.service';
import { EntradasCentralController } from './entradas-central.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntradasCentralController],
  providers: [EntradasCentralService],
  exports: [EntradasCentralService],
})
export class EntradasCentralModule {}
