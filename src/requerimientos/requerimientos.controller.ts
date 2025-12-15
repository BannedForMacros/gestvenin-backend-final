// src/requerimientos/requerimientos.controller.ts
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
import { RequerimientosService } from './requerimientos.service';
import { CrearRequerimientoDto } from './dto/crear-requerimiento.dto';
import { EditarRequerimientoDto } from './dto/editar-requerimiento.dto';
import { RevisarRequerimientoDto } from './dto/revisar-requerimiento.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Requerimientos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('requerimientos')
export class RequerimientosController {
  constructor(private readonly requerimientosService: RequerimientosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear requerimiento' })
  @RequierePermisos('requerimientos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearRequerimientoDto) {
    return this.requerimientosService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar requerimientos con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['borrador', 'revision', 'aprobado', 'rechazado', 'comprado'],
  })
  @RequierePermisos('requerimientos.ver')
  listar(
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
    @Query('estado') estado?: string,
  ) {
    const { page, limit, search } = paginationDto;
    return this.requerimientosService.listarPaginado(
      req.user.schema,
      req.user.id,
      req.user.permisos,
      page,
      limit,
      search,
      estado,
    );
  }

  @Get('aprobados')
  @ApiOperation({
    summary: 'Listar requerimientos aprobados (para crear entrada)',
  })
  @RequierePermisos('inventario_central.entradas')
  listarAprobados(@Req() req: RequestWithUser) {
    return this.requerimientosService.listarAprobados(req.user.schema);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener requerimiento por ID' })
  @RequierePermisos('requerimientos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requerimientosService.obtenerPorId(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar requerimiento (solo en borrador)' })
  @RequierePermisos('requerimientos.editar')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarRequerimientoDto,
  ) {
    return this.requerimientosService.editar(
      req.user.schema,
      id,
      req.user.id,
      dto,
    );
  }

  @Post(':id/enviar-revision')
  @ApiOperation({ summary: 'Enviar requerimiento a revisión' })
  @RequierePermisos('requerimientos.editar')
  enviarRevision(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.requerimientosService.enviarRevision(
      req.user.schema,
      id,
      req.user.id,
    );
  }

  @Patch(':id/revisar')
  @ApiOperation({
    summary: 'Aprobar/Rechazar requerimiento (puede editar items)',
  })
  @RequierePermisos('requerimientos.aprobar')
  revisar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RevisarRequerimientoDto,
  ) {
    return this.requerimientosService.revisar(
      req.user.schema,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar requerimiento (solo en borrador)' })
  @RequierePermisos('requerimientos.editar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.requerimientosService.eliminar(
      req.user.schema,
      id,
      req.user.id,
    );
  }
}
