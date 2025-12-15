// src/productos/productos.controller.ts
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
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { EditarProductoDto } from './dto/editar-producto.dto';
import { AsignarUnidadesDto } from './dto/asignar-unidades.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({ summary: 'Crear producto con unidades' })
  @RequierePermisos('productos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearProductoDto) {
    return this.productosService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'categoriaId', required: false, type: Number })
  @RequierePermisos('productos.ver')
  listar(
    @Req() req: RequestWithUser,
    @Query() paginationDto: PaginationDto,
    @Query('categoriaId', new ParseIntPipe({ optional: true }))
    categoriaId?: number,
  ) {
    const { page, limit, search } = paginationDto;
    return this.productosService.listarPaginado(
      req.user.schema,
      page,
      limit,
      search,
      categoriaId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID con sus unidades' })
  @RequierePermisos('productos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productosService.obtenerPorId(req.user.schema, id);
  }

  @Get(':id/unidades')
  @ApiOperation({ summary: 'Obtener unidades de medida de un producto' })
  @RequierePermisos('productos.ver')
  obtenerUnidades(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productosService.obtenerUnidadesDeProducto(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar producto' })
  @RequierePermisos('productos.editar')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarProductoDto,
  ) {
    return this.productosService.editar(req.user.schema, id, req.user.id, dto);
  }

  @Post(':id/unidades')
  @ApiOperation({ summary: 'Asignar unidades de medida a producto' })
  @RequierePermisos('productos.editar')
  asignarUnidades(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AsignarUnidadesDto,
  ) {
    return this.productosService.asignarUnidades(
      req.user.schema,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto' })
  @RequierePermisos('productos.eliminar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.productosService.eliminar(req.user.schema, id, req.user.id);
  }
}
