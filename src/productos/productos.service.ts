// src/productos/productos.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { EditarProductoDto } from './dto/editar-producto.dto';
import { Producto } from './interfaces/producto.interface';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    empresaId: number,
    usuarioId: number,
    dto: CrearProductoDto,
  ): Promise<Producto> {
    const resultado = await this.prisma.$queryRawUnsafe<Producto[]>(
      `INSERT INTO "${schema}".productos 
       (codigo, nombre, descripcion, unidad_medida, categoria, stock_minimo, creado_por, actualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      dto.codigo || null,
      dto.nombre,
      dto.descripcion || null,
      dto.unidadMedida,
      dto.categoria || null,
      dto.stockMinimo || 0,
      usuarioId,
      usuarioId,
    );

    return resultado[0];
  }

  async listar(schema: string): Promise<Producto[]> {
    return await this.prisma.$queryRawUnsafe<Producto[]>(
      `SELECT * FROM "${schema}".productos 
       WHERE activo = true 
       ORDER BY nombre ASC`,
    );
  }

  async obtenerPorId(schema: string, id: number): Promise<Producto> {
    const resultado = await this.prisma.$queryRawUnsafe<Producto[]>(
      `SELECT * FROM "${schema}".productos WHERE id = $1`,
      id,
    );

    if (!resultado || resultado.length === 0) {
      throw new ForbiddenException('Producto no encontrado');
    }

    return resultado[0];
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarProductoDto,
  ): Promise<Producto> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (dto.codigo !== undefined) {
      campos.push(`codigo = $${idx++}`);
      valores.push(dto.codigo);
    }
    if (dto.nombre !== undefined) {
      campos.push(`nombre = $${idx++}`);
      valores.push(dto.nombre);
    }
    if (dto.descripcion !== undefined) {
      campos.push(`descripcion = $${idx++}`);
      valores.push(dto.descripcion);
    }
    if (dto.unidadMedida !== undefined) {
      campos.push(`unidad_medida = $${idx++}`);
      valores.push(dto.unidadMedida);
    }
    if (dto.categoria !== undefined) {
      campos.push(`categoria = $${idx++}`);
      valores.push(dto.categoria);
    }
    if (dto.stockMinimo !== undefined) {
      campos.push(`stock_minimo = $${idx++}`);
      valores.push(dto.stockMinimo);
    }
    if (dto.activo !== undefined) {
      campos.push(`activo = $${idx++}`);
      valores.push(dto.activo);
    }

    campos.push(`actualizado_por = $${idx++}`);
    valores.push(usuarioId);
    campos.push(`actualizado_en = NOW()`);

    valores.push(id);

    const resultado = await this.prisma.$queryRawUnsafe<Producto[]>(
      `UPDATE "${schema}".productos 
       SET ${campos.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      ...valores,
    );

    return resultado[0];
  }

  async eliminar(
    schema: string,
    id: number,
    usuarioId: number,
  ): Promise<Producto> {
    const resultado = await this.prisma.$queryRawUnsafe<Producto[]>(
      `UPDATE "${schema}".productos 
       SET activo = false, actualizado_por = $1, actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      usuarioId,
      id,
    );

    return resultado[0];
  }
}
