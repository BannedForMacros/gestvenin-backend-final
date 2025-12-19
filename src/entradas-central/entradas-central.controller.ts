// src/entradas-central/entradas-central.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { EntradasCentralService } from './entradas-central.service';
import { CrearEntradaDto } from './dto/crear-entrada.dto';
import { EditarEntradaDto } from './dto/editar-entrada.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Entradas Central')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('entradas-central')
export class EntradasCentralController {
  constructor(private readonly entradasService: EntradasCentralService) {}

  @Post()
  @ApiOperation({ summary: 'Crear entrada al inventario central' })
  @RequierePermisos('inventario_central.entradas')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearEntradaDto) {
    return this.entradasService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar entradas con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @RequierePermisos('inventario_central.ver')
  listar(@Req() req: RequestWithUser, @Query() paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;
    return this.entradasService.listarPaginado(
      req.user.schema,
      page,
      limit,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener entrada por ID' })
  @RequierePermisos('inventario_central.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.entradasService.obtenerPorId(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar entrada' })
  @RequierePermisos('inventario_central.entradas')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarEntradaDto,
  ) {
    return this.entradasService.editar(req.user.schema, id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar entrada (anular)' })
  @RequierePermisos('inventario_central.entradas')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.entradasService.eliminar(req.user.schema, id, req.user.id);
  }
}
