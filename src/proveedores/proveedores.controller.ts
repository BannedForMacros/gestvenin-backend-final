// src/proveedores/proveedores.controller.ts
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
import { ProveedoresService } from './proveedores.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { EditarProveedorDto } from './dto/editar-proveedor.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crear proveedor' })
  @RequierePermisos('productos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearProveedorDto) {
    return this.proveedoresService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar proveedores con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @RequierePermisos('productos.ver')
  listar(@Req() req: RequestWithUser, @Query() paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;
    return this.proveedoresService.listarPaginado(
      req.user.schema,
      page,
      limit,
      search,
    );
  }

  @Get('activos')
  @ApiOperation({ summary: 'Listar proveedores activos (para selects)' })
  @RequierePermisos('productos.ver')
  listarActivos(@Req() req: RequestWithUser) {
    return this.proveedoresService.listarActivos(req.user.schema);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener proveedor por ID' })
  @RequierePermisos('productos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.proveedoresService.obtenerPorId(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar proveedor' })
  @RequierePermisos('productos.editar')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarProveedorDto,
  ) {
    return this.proveedoresService.editar(
      req.user.schema,
      id,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar proveedor' })
  @RequierePermisos('productos.eliminar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.proveedoresService.eliminar(req.user.schema, id, req.user.id);
  }
}
