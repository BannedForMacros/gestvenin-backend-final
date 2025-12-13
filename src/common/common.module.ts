// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PermisosGuard } from './guards/permisos.guard';

@Module({
  providers: [JwtStrategy, PermisosGuard],
  exports: [JwtStrategy, PermisosGuard],
})
export class CommonModule {}
