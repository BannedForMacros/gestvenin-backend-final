// src/roles/roles.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CrearRolDto } from './dto/crear-rol.dto';
import { AsignarPermisosDto } from './dto/asignar-permisos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  @RequierePermisos('roles.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearRolDto) {
    return this.rolesService.crear(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles con permisos' })
  @RequierePermisos('roles.ver')
  listar(@Req() req: RequestWithUser) {
    return this.rolesService.listar(req.user.empresaId);
  }

  @Post(':id/permisos')
  @ApiOperation({ summary: 'Asignar permisos a rol' })
  @RequierePermisos('roles.editar')
  asignarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() dto: AsignarPermisosDto,
  ) {
    return this.rolesService.asignarPermisos(id, req.user.empresaId, dto);
  }

  @Get(':id/menus-disponibles')
  @ApiOperation({ summary: 'Ver qué menús puede ver este rol' })
  @RequierePermisos('roles.ver')
  obtenerMenusDelRol(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.rolesService.obtenerMenusDelRol(id, req.user.empresaId);
  }
}
