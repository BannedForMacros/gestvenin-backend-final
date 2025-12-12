// src/permisos/permisos.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PermisosService } from './permisos.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Permisos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('permisos')
export class PermisosController {
  constructor(private readonly permisosService: PermisosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar permisos disponibles' })
  listar() {
    return this.permisosService.listar();
  }
}
