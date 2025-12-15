// src/categorias/categorias.controller.ts
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
import { CategoriasService } from './categorias.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { EditarCategoriaDto } from './dto/editar-categoria.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermisosGuard } from '../common/guards/permisos.guard';
import { RequierePermisos } from '../common/decorators/permisos.decorator';
import type { RequestWithUser } from '../common/interfaces/request-user.interface';

@ApiTags('Categorías')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermisosGuard)
@Controller('categorias')
export class CategoriasController {
  constructor(private readonly categoriasService: CategoriasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear categoría' })
  @RequierePermisos('productos.crear')
  crear(@Req() req: RequestWithUser, @Body() dto: CrearCategoriaDto) {
    return this.categoriasService.crear(req.user.schema, req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar categorías con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @RequierePermisos('productos.ver')
  listar(@Req() req: RequestWithUser, @Query() paginationDto: PaginationDto) {
    const { page, limit, search } = paginationDto;
    return this.categoriasService.listarPaginado(
      req.user.schema,
      page,
      limit,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener categoría por ID' })
  @RequierePermisos('productos.ver')
  obtenerPorId(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriasService.obtenerPorId(req.user.schema, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar categoría' })
  @RequierePermisos('productos.editar')
  editar(
    @Req() req: RequestWithUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EditarCategoriaDto,
  ) {
    return this.categoriasService.editar(req.user.schema, id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría' })
  @RequierePermisos('productos.eliminar')
  eliminar(@Req() req: RequestWithUser, @Param('id', ParseIntPipe) id: number) {
    return this.categoriasService.eliminar(req.user.schema, id, req.user.id);
  }
}
