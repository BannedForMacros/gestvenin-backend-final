// src/usuarios/usuarios.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { EditarUsuarioDto } from './dto/editar-usuario.dto';
import { AsignarLocalesDto } from './dto/asignar-locales.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear usuario' })
  @RequierePermisos('usuarios.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearUsuarioDto) {
    return this.usuariosService.crear(req.user.empresaId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar usuarios' })
  @RequierePermisos('usuarios.ver')
  listar(@Req() req: RequestWithUser) {
    return this.usuariosService.listar(req.user.empresaId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar usuario' })
  @RequierePermisos('usuarios.editar')
  editar(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() dto: EditarUsuarioDto,
  ) {
    return this.usuariosService.editar(id, req.user.empresaId, dto);
  }

  @Post(':id/locales')
  @ApiOperation({ summary: 'Asignar locales a usuario' })
  @RequierePermisos('usuarios.editar')
  asignarLocales(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
    @Body() dto: AsignarLocalesDto,
  ) {
    return this.usuariosService.asignarLocales(id, req.user.empresaId, dto);
  }
}
