// src/auth/auth.controller.ts
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('registro')
  @ApiOperation({ summary: 'Registrar nueva empresa' })
  registro(@Body() dto: RegistroDto) {
    return this.authService.registro(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me/refresh')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Refrescar permisos del usuario actual' })
  async refreshPermisos(@Req() req: RequestWithUser) {
    return this.authService.refreshPermisos(req.user.id);
  }

  @Get('me/menu')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener menú del usuario' })
  async obtenerMenu(@Req() req: RequestWithUser) {
    return this.authService.obtenerMenu(req.user.id);
  }

  @Get('menus/todos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermisosGuard)
  @RequierePermisos('roles.editar')
  @ApiOperation({ summary: 'Listar todos los menús disponibles' })
  async listarTodosLosMenus() {
    return this.authService.listarTodosLosMenus();
  }
}
