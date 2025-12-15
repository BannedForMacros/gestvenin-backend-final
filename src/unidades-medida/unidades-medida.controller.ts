// src/unidades-medida/unidades-medida.controller.ts
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
import { UnidadesMedidaService } from './unidades-medida.service';
import { CrearUnidadMedidaDto } from './dto/crear-unidad-medida.dto';
import { EditarUnidadMedidaDto } from './dto/editar-unidad-medida.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Unidades de Medida')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('unidades-medida')
export class UnidadesMedidaController {
  constructor(private readonly unidadesMedidaService: UnidadesMedidaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear unidad de medida' })
  @RequierePermisos('productos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearUnidadMedidaDto) {
    return this.unidadesMedidaService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar unidades de medida con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: ['peso', 'volumen', 'cantidad'],
  })
  @RequierePermisos('productos.ver')
  listar(
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
    @Query('tipo') tipo?: string,
  ) {
    const { page, limit, search } = paginationDto;
    return this.unidadesMedidaService.listarPaginado(
      req.user.schema,
      page,
      limit,
      search,
      tipo,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener unidad de medida por ID' })
  @RequierePermisos('productos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.unidadesMedidaService.obtenerPorId(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar unidad de medida' })
  @RequierePermisos('productos.editar')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarUnidadMedidaDto,
  ) {
    return this.unidadesMedidaService.editar(
      req.user.schema,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar unidad de medida' })
  @RequierePermisos('productos.eliminar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.unidadesMedidaService.eliminar(
      req.user.schema,
      id,
      req.user.id,
    );
  }
}
