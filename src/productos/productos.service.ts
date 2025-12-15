// src/productos/productos.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProductoDto } from './dto/crear-producto.dto';
import { EditarProductoDto } from './dto/editar-producto.dto';
import { AsignarUnidadesDto } from './dto/asignar-unidades.dto';
import {
  Producto,
  ProductoConUnidades,
  ProductoUnidad,
} from './interfaces/producto.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class ProductosService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearProductoDto,
  ): Promise<ProductoConUnidades> {
    // Validar que solo haya UNA unidad base
    const unidadesBase = dto.unidades.filter((u) => u.esUnidadBase);
    if (unidadesBase.length !== 1) {
      throw new BadRequestException('Debe haber exactamente una unidad base');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Crear producto
      const productoResult = await tx.$queryRawUnsafe<Producto[]>(
        `INSERT INTO "${schema}".productos
         (codigo, codigo_barras, nombre, descripcion, categoria_id, stock_minimo, creado_por, actualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
        dto.codigo || null,
        dto.codigoBarras || null,
        dto.nombre,
        dto.descripcion || null,
        dto.categoriaId || null,
        dto.stockMinimo || 0,
        usuarioId,
        usuarioId,
      );

      const producto = productoResult[0];

      // 2. Asignar unidades
      const unidades: ProductoUnidad[] = [];
      for (const unidad of dto.unidades) {
        const unidadResult = await tx.$queryRawUnsafe<ProductoUnidad[]>(
          `INSERT INTO "${schema}".producto_unidades
           (producto_id, unidad_medida_id, es_unidad_base, creado_por, actualizado_por)
           VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
          producto.id,
          unidad.unidadMedidaId,
          unidad.esUnidadBase,
          usuarioId,
          usuarioId,
        );
        unidades.push(unidadResult[0]);
      }

      return {
        ...producto,
        unidades,
      };
    });
  }

  async listarPaginado(
    schema: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
    categoriaId?: number,
  ): Promise<PaginatedResponse<Producto>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    let conditions = 'WHERE activo = true';
    const params: unknown[] = [limit, skip];
    let paramIndex = 3;

    if (categoriaId) {
      conditions += ` AND categoria_id = $${paramIndex}`;
      params.push(categoriaId);
      paramIndex++;
    }

    if (search) {
      conditions += ` AND (nombre ILIKE $${paramIndex} OR codigo ILIKE $${paramIndex} OR codigo_barras ILIKE $${paramIndex})`;
      params.push(searchParam);
    }

    // 1. OBTENER DATOS
    const data = await this.prisma.$queryRawUnsafe<Producto[]>(
      `SELECT * FROM "${schema}".productos
                       ${conditions}
       ORDER BY nombre ASC
         LIMIT $1 OFFSET $2`,
      ...params,
    );

    // 2. OBTENER TOTAL
    const countParams: unknown[] = [];
    let countConditions = 'WHERE activo = true';
    let countParamIndex = 1;

    if (categoriaId) {
      countConditions += ` AND categoria_id = $${countParamIndex}`;
      countParams.push(categoriaId);
      countParamIndex++;
    }

    if (search) {
      countConditions += ` AND (nombre ILIKE $${countParamIndex} OR codigo ILIKE $${countParamIndex} OR codigo_barras ILIKE $${countParamIndex})`;
      countParams.push(searchParam);
    }

    const totalResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".productos
        ${countConditions}`,
      ...countParams,
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

  async obtenerPorId(schema: string, id: number): Promise<ProductoConUnidades> {
    const productoResult = await this.prisma.$queryRawUnsafe<Producto[]>(
      `SELECT * FROM "${schema}".productos WHERE id = $1`,
      id,
    );

    if (!productoResult || productoResult.length === 0) {
      throw new ForbiddenException('Producto no encontrado');
    }

    const unidades = await this.prisma.$queryRawUnsafe<ProductoUnidad[]>(
      `SELECT * FROM "${schema}".producto_unidades
       WHERE producto_id = $1 AND activo = true
       ORDER BY es_unidad_base DESC`,
      id,
    );

    return {
      ...productoResult[0],
      unidades,
    };
  }

  async obtenerUnidadesDeProducto(
    schema: string,
    productoId: number,
  ): Promise<ProductoUnidad[]> {
    return await this.prisma.$queryRawUnsafe<ProductoUnidad[]>(
      `SELECT pu.*, um.nombre, um.abreviatura, um.tipo, um.factor_a_base
       FROM "${schema}".producto_unidades pu
              INNER JOIN "${schema}".unidades_medida um ON pu.unidad_medida_id = um.id
       WHERE pu.producto_id = $1 AND pu.activo = true
       ORDER BY pu.es_unidad_base DESC, um.nombre ASC`,
      productoId,
    );
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
    if (dto.codigoBarras !== undefined) {
      campos.push(`codigo_barras = $${idx++}`);
      valores.push(dto.codigoBarras);
    }
    if (dto.nombre !== undefined) {
      campos.push(`nombre = $${idx++}`);
      valores.push(dto.nombre);
    }
    if (dto.descripcion !== undefined) {
      campos.push(`descripcion = $${idx++}`);
      valores.push(dto.descripcion);
    }
    if (dto.categoriaId !== undefined) {
      campos.push(`categoria_id = $${idx++}`);
      valores.push(dto.categoriaId);
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

  // --- 🔥 MÉTODO CORREGIDO PARA EVITAR ERROR 500 ---
  async asignarUnidades(
    schema: string,
    productoId: number,
    usuarioId: number,
    dto: AsignarUnidadesDto,
  ): Promise<ProductoUnidad[]> {
    const unidadesBase = dto.unidades.filter((u) => u.esUnidadBase);
    if (unidadesBase.length !== 1) {
      throw new BadRequestException('Debe haber exactamente una unidad base');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Desactivar TODAS las unidades anteriores de este producto
      await tx.$queryRawUnsafe(
        `UPDATE "${schema}".producto_unidades
         SET activo = false, actualizado_por = $1, actualizado_en = NOW()
         WHERE producto_id = $2`,
        usuarioId,
        productoId,
      );

      const unidades: ProductoUnidad[] = [];

      for (const unidad of dto.unidades) {
        // 2. Intentar ACTUALIZAR (Reactivar) si ya existe la relación
        // Esto evita el error de llave duplicada
        const resultUpdate = await tx.$queryRawUnsafe<ProductoUnidad[]>(
          `UPDATE "${schema}".producto_unidades
           SET activo = true, 
               es_unidad_base = $3, 
               actualizado_por = $4, 
               actualizado_en = NOW()
           WHERE producto_id = $1 AND unidad_medida_id = $2
           RETURNING *`,
          productoId,
          unidad.unidadMedidaId,
          unidad.esUnidadBase,
          usuarioId,
        );

        if (resultUpdate.length > 0) {
          // Si existía y se actualizó, la agregamos a la lista
          unidades.push(resultUpdate[0]);
        } else {
          // 3. Si NO existía, entonces hacemos el INSERT
          const resultInsert = await tx.$queryRawUnsafe<ProductoUnidad[]>(
            `INSERT INTO "${schema}".producto_unidades 
             (producto_id, unidad_medida_id, es_unidad_base, creado_por, actualizado_por)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            productoId,
            unidad.unidadMedidaId,
            unidad.esUnidadBase,
            usuarioId,
            usuarioId,
          );
          unidades.push(resultInsert[0]);
        }
      }

      return unidades;
    });
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
