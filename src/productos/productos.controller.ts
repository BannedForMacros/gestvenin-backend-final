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
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { EditarProductoDto } from './dto/editar-producto.dto';
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
  @ApiOperation({ summary: 'Crear producto' })
  @RequierePermisos('productos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearProductoDto) {
    return this.productosService.crear(
      req.user.schema,
      req.user.empresaId,
      req.user.id,
      dto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @RequierePermisos('productos.ver')
  listar(@Req() req: RequestWithUser) {
    return this.productosService.listar(req.user.schema);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @RequierePermisos('productos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.productosService.obtenerPorId(req.user.schema, id);
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

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar producto (desactivar)' })
  @RequierePermisos('productos.eliminar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.productosService.eliminar(req.user.schema, id, req.user.id);
  }
}
