// src/categorias/categorias.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearCategoriaDto } from './dto/crear-categoria.dto';
import { EditarCategoriaDto } from './dto/editar-categoria.dto';
import { Categoria } from './interfaces/categoria.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearCategoriaDto,
  ): Promise<Categoria> {
    const resultado = await this.prisma.$queryRawUnsafe<Categoria[]>(
      `INSERT INTO "${schema}".categorias
         (nombre, descripcion, creado_por, actualizado_por)
       VALUES ($1, $2, $3, $4)
         RETURNING *`,
      dto.nombre,
      dto.descripcion || null,
      usuarioId,
      usuarioId,
    );

    return resultado[0];
  }

  async listarPaginado(
    schema: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResponse<Categoria>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    // 1. OBTENER DATOS
    const data = search
      ? await this.prisma.$queryRawUnsafe<Categoria[]>(
          `SELECT * FROM "${schema}".categorias 
         WHERE activo = true 
         AND (nombre ILIKE $3 OR descripcion ILIKE $3)
         ORDER BY nombre ASC
         LIMIT $1 OFFSET $2`,
          limit, // $1
          skip, // $2
          searchParam, // $3
        )
      : await this.prisma.$queryRawUnsafe<Categoria[]>(
          `SELECT * FROM "${schema}".categorias 
         WHERE activo = true 
         ORDER BY nombre ASC
         LIMIT $1 OFFSET $2`,
          limit, // $1
          skip, // $2
        );

    // 2. OBTENER TOTAL (CORREGIDO)
    const totalResult = search
      ? await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "${schema}".categorias 
         WHERE activo = true 
         AND (nombre ILIKE $1 OR descripcion ILIKE $1)`,
          searchParam, // $1 (solo 1 parámetro aquí)
        )
      : await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "${schema}".categorias 
         WHERE activo = true`,
        );

    const total = Number(totalResult[0].count);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  // Mantener el método original para compatibilidad
  async listar(schema: string): Promise<Categoria[]> {
    return await this.prisma.$queryRawUnsafe<Categoria[]>(
      `SELECT * FROM "${schema}".categorias 
       WHERE activo = true 
       ORDER BY nombre ASC`,
    );
  }

  async obtenerPorId(schema: string, id: number): Promise<Categoria> {
    const resultado = await this.prisma.$queryRawUnsafe<Categoria[]>(
      `SELECT * FROM "${schema}".categorias WHERE id = $1`,
      id,
    );

    if (!resultado || resultado.length === 0) {
      throw new ForbiddenException('Categoría no encontrada');
    }

    return resultado[0];
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarCategoriaDto,
  ): Promise<Categoria> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (dto.nombre !== undefined) {
      campos.push(`nombre = $${idx++}`);
      valores.push(dto.nombre);
    }
    if (dto.descripcion !== undefined) {
      campos.push(`descripcion = $${idx++}`);
      valores.push(dto.descripcion);
    }
    if (dto.activo !== undefined) {
      campos.push(`activo = $${idx++}`);
      valores.push(dto.activo);
    }

    campos.push(`actualizado_por = $${idx++}`);
    valores.push(usuarioId);
    campos.push(`actualizado_en = NOW()`);

    valores.push(id);

    const resultado = await this.prisma.$queryRawUnsafe<Categoria[]>(
      `UPDATE "${schema}".categorias 
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
  ): Promise<Categoria> {
    const resultado = await this.prisma.$queryRawUnsafe<Categoria[]>(
      `UPDATE "${schema}".categorias 
       SET activo = false, actualizado_por = $1, actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      usuarioId,
      id,
    );

    return resultado[0];
  }
}
