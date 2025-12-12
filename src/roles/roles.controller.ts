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
import * as requestUserInterface from '../common/interfaces/request-user.interface';

@ApiTags('Roles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear rol' })
  crear(
    @Req() req: requestUserInterface.RequestWithUser,
    @Body() dto: CrearRolDto,
  ) {
    return this.rolesService.crear(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar roles con permisos' })
  listar(@Req() req: requestUserInterface.RequestWithUser) {
    return this.rolesService.listar(req.user.empresaId);
  }

  @Post(':id/permisos')
  @ApiOperation({ summary: 'Asignar permisos a rol' })
  asignarPermisos(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: requestUserInterface.RequestWithUser,
    @Body() dto: AsignarPermisosDto,
  ) {
    return this.rolesService.asignarPermisos(id, req.user.empresaId, dto);
  }
}
