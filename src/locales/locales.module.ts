// src/locales/locales.module.ts
import { Module } from '@nestjs/common';
import { LocalesService } from './locales.service';
import { LocalesController } from './locales.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LocalesController],
  providers: [LocalesService],
})
export class LocalesModule {}
