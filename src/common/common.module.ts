// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  providers: [JwtStrategy],
  exports: [JwtStrategy],
})
export class CommonModule {}
