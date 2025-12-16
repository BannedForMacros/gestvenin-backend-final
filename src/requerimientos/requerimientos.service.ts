// src/requerimientos/requerimientos.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearRequerimientoDto } from './dto/crear-requerimiento.dto';
import { EditarRequerimientoDto } from './dto/editar-requerimiento.dto';
import { RevisarRequerimientoDto } from './dto/revisar-requerimiento.dto';
import {
  Requerimiento,
  RequerimientoCompleto,
  RequerimientoItem,
} from './interfaces/requerimiento.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class RequerimientosService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearRequerimientoDto,
  ): Promise<RequerimientoCompleto> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Generar código
      const year = new Date().getFullYear();
      const countResult = await tx.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM "${schema}".requerimientos 
         WHERE codigo LIKE 'REQ-${year}-%'`,
      );
      const siguiente = Number(countResult[0].count) + 1;
      const codigo = `REQ-${year}-${String(siguiente).padStart(4, '0')}`;

      // 2. Crear requerimiento
      const reqResult = await tx.$queryRawUnsafe<Requerimiento[]>(
        `INSERT INTO "${schema}".requerimientos 
         (codigo, tipo, estado, observaciones, creado_por, actualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        codigo,
        'manual',
        'borrador',
        dto.observaciones || null,
        usuarioId,
        usuarioId,
      );

      const requerimiento = reqResult[0];

      // 3. Insertar items con validación y cálculo de precios
      const items: RequerimientoItem[] = [];

      for (const item of dto.items) {
        // Validar que la unidad esté asignada al producto
        const unidadPermitida = await tx.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "${schema}".producto_unidades 
           WHERE producto_id = $1 AND unidad_medida_id = $2 AND activo = true`,
          item.productoId,
          item.unidadMedidaId,
        );

        if (Number(unidadPermitida[0].count) === 0) {
          throw new BadRequestException(
            'La unidad de medida seleccionada no está asignada al producto',
          );
        }

        // Calcular precios
        let precioUnitario = item.precioUnitarioEstimado || null;
        let precioTotal = item.precioTotalEstimado || null;

        // Si no hay precios, intentar obtener del inventario
        if (!precioUnitario && !precioTotal) {
          const inventarioResult = await tx.$queryRawUnsafe<
            { precio_promedio: number }[]
          >(
            `SELECT precio_promedio FROM "${schema}".inventario_central 
             WHERE producto_id = $1`,
            item.productoId,
          );

          if (
            inventarioResult.length > 0 &&
            inventarioResult[0].precio_promedio
          ) {
            precioUnitario = Number(inventarioResult[0].precio_promedio);
            precioTotal = precioUnitario * item.cantidad;
          }
        } else if (precioUnitario && !precioTotal) {
          precioTotal = precioUnitario * item.cantidad;
        } else if (!precioUnitario && precioTotal) {
          precioUnitario = precioTotal / item.cantidad;
        }

        const itemResult = await tx.$queryRawUnsafe<RequerimientoItem[]>(
          `INSERT INTO "${schema}".requerimiento_items 
           (requerimiento_id, producto_id, unidad_medida_id, cantidad, precio_unitario_estimado, precio_total_estimado, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          requerimiento.id,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
          precioUnitario,
          precioTotal,
          item.observaciones || null,
        );

        items.push(itemResult[0]);
      }

      return {
        ...requerimiento,
        items,
      };
    });
  }

  async listarPaginado(
    schema: string,
    usuarioId: number,
    permisos: string[],
    page: number = 1,
    limit: number = 10,
    search?: string,
    estado?: string,
  ): Promise<PaginatedResponse<Requerimiento>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    // ← ELIMINAR ESTAS LÍNEAS
    // const puedeAprobar = permisos.includes('requerimientos.aprobar');
    // const puedeCrear = permisos.includes('requerimientos.crear');

    let conditions = "WHERE estado != 'eliminado'";
    const params: unknown[] = [limit, skip];
    let paramIndex = 3;

    // ← ELIMINAR TODO ESTE BLOQUE
    // if (puedeCrear && !puedeAprobar) {
    //   conditions += ` AND creado_por = $${paramIndex}`;
    //   params.push(usuarioId);
    //   paramIndex++;
    // }

    if (estado) {
      conditions += ` AND estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (search) {
      conditions += ` AND codigo ILIKE $${paramIndex}`;
      params.push(searchParam);
    }

    // 1. OBTENER DATOS
    const data = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos 
     ${conditions}
     ORDER BY creado_en DESC
     LIMIT $1 OFFSET $2`,
      ...params,
    );

    // 2. OBTENER TOTAL
    const countParams: unknown[] = [];
    let countConditions = "WHERE estado != 'eliminado'";
    let countParamIndex = 1;

    // ← ELIMINAR ESTE BLOQUE TAMBIÉN
    // if (puedeCrear && !puedeAprobar) {
    //   countConditions += ` AND creado_por = $${countParamIndex}`;
    //   countParams.push(usuarioId);
    //   countParamIndex++;
    // }

    if (estado) {
      countConditions += ` AND estado = $${countParamIndex}`;
      countParams.push(estado);
      countParamIndex++;
    }

    if (search) {
      countConditions += ` AND codigo ILIKE $${countParamIndex}`;
      countParams.push(searchParam);
    }

    const totalResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".requerimientos 
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

  async obtenerPorId(
    schema: string,
    id: number,
  ): Promise<RequerimientoCompleto> {
    const reqResult = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos WHERE id = $1`,
      id,
    );

    if (!reqResult || reqResult.length === 0) {
      throw new ForbiddenException('Requerimiento no encontrado');
    }

    const items = await this.prisma.$queryRawUnsafe<RequerimientoItem[]>(
      `SELECT ri.*, 
              p.nombre as producto_nombre, 
              p.codigo as producto_codigo,
              um.nombre as unidad_nombre,
              um.abreviatura as unidad_abreviatura
       FROM "${schema}".requerimiento_items ri
       INNER JOIN "${schema}".productos p ON ri.producto_id = p.id
       INNER JOIN "${schema}".unidades_medida um ON ri.unidad_medida_id = um.id
       WHERE ri.requerimiento_id = $1
       ORDER BY ri.id ASC`,
      id,
    );

    return {
      ...reqResult[0],
      items,
    };
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarRequerimientoDto,
  ): Promise<RequerimientoCompleto> {
    const reqActual = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos WHERE id = $1`,
      id,
    );

    if (!reqActual || reqActual.length === 0) {
      throw new ForbiddenException('Requerimiento no encontrado');
    }

    if (reqActual[0].estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se pueden editar requerimientos en borrador',
      );
    }

    if (reqActual[0].creado_por !== usuarioId) {
      throw new ForbiddenException(
        'Solo el creador puede editar el requerimiento',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Actualizar observaciones si vienen
      if (dto.observaciones !== undefined) {
        await tx.$queryRawUnsafe(
          `UPDATE "${schema}".requerimientos 
           SET observaciones = $1, actualizado_por = $2, actualizado_en = NOW()
           WHERE id = $3`,
          dto.observaciones,
          usuarioId,
          id,
        );
      }

      // 2. Si hay items, reemplazar
      if (dto.items) {
        // Eliminar items anteriores
        await tx.$queryRawUnsafe(
          `DELETE FROM "${schema}".requerimiento_items WHERE requerimiento_id = $1`,
          id,
        );

        // Insertar nuevos
        for (const item of dto.items) {
          // Validar unidad
          const unidadPermitida = await tx.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM "${schema}".producto_unidades 
             WHERE producto_id = $1 AND unidad_medida_id = $2 AND activo = true`,
            item.productoId,
            item.unidadMedidaId,
          );

          if (Number(unidadPermitida[0].count) === 0) {
            throw new BadRequestException(
              'La unidad de medida seleccionada no está asignada al producto',
            );
          }

          // Calcular precios
          let precioUnitario = item.precioUnitarioEstimado || null;
          let precioTotal = item.precioTotalEstimado || null;

          if (!precioUnitario && !precioTotal) {
            const inventarioResult = await tx.$queryRawUnsafe<
              { precio_promedio: number }[]
            >(
              `SELECT precio_promedio FROM "${schema}".inventario_central 
               WHERE producto_id = $1`,
              item.productoId,
            );

            if (
              inventarioResult.length > 0 &&
              inventarioResult[0].precio_promedio
            ) {
              precioUnitario = Number(inventarioResult[0].precio_promedio);
              precioTotal = precioUnitario * item.cantidad;
            }
          } else if (precioUnitario && !precioTotal) {
            precioTotal = precioUnitario * item.cantidad;
          } else if (!precioUnitario && precioTotal) {
            precioUnitario = precioTotal / item.cantidad;
          }

          await tx.$queryRawUnsafe(
            `INSERT INTO "${schema}".requerimiento_items 
             (requerimiento_id, producto_id, unidad_medida_id, cantidad, precio_unitario_estimado, precio_total_estimado, observaciones)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            id,
            item.productoId,
            item.unidadMedidaId,
            item.cantidad,
            precioUnitario,
            precioTotal,
            item.observaciones || null,
          );
        }
      }

      return this.obtenerPorId(schema, id);
    });
  }

  async enviarRevision(
    schema: string,
    id: number,
    usuarioId: number,
  ): Promise<Requerimiento> {
    const reqActual = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos WHERE id = $1`,
      id,
    );

    if (!reqActual || reqActual.length === 0) {
      throw new ForbiddenException('Requerimiento no encontrado');
    }

    if (reqActual[0].estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se pueden enviar requerimientos en borrador',
      );
    }

    if (reqActual[0].creado_por !== usuarioId) {
      throw new ForbiddenException(
        'Solo el creador puede enviar el requerimiento',
      );
    }

    const resultado = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `UPDATE "${schema}".requerimientos 
       SET estado = 'revision', 
           enviado_revision_por = $1, 
           fecha_envio_revision = NOW(),
           actualizado_por = $1,
           actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      usuarioId,
      id,
    );

    return resultado[0];
  }

  async revisar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: RevisarRequerimientoDto,
  ): Promise<Requerimiento> {
    const reqActual = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos WHERE id = $1`,
      id,
    );

    if (!reqActual || reqActual.length === 0) {
      throw new ForbiddenException('Requerimiento no encontrado');
    }

    if (reqActual[0].estado !== 'revision') {
      throw new BadRequestException(
        'Solo se pueden revisar requerimientos en revisión',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Si hay items, actualizarlos
      if (dto.items) {
        await tx.$queryRawUnsafe(
          `DELETE FROM "${schema}".requerimiento_items WHERE requerimiento_id = $1`,
          id,
        );

        for (const item of dto.items) {
          // Validar unidad
          const unidadPermitida = await tx.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*) as count FROM "${schema}".producto_unidades 
           WHERE producto_id = $1 AND unidad_medida_id = $2 AND activo = true`,
            item.productoId,
            item.unidadMedidaId,
          );

          if (Number(unidadPermitida[0].count) === 0) {
            throw new BadRequestException(
              'La unidad de medida seleccionada no está asignada al producto',
            );
          }

          let precioUnitario = item.precioUnitarioEstimado || null;
          let precioTotal = item.precioTotalEstimado || null;

          if (precioUnitario && !precioTotal) {
            precioTotal = precioUnitario * item.cantidad;
          } else if (!precioUnitario && precioTotal) {
            precioUnitario = precioTotal / item.cantidad;
          }

          await tx.$queryRawUnsafe(
            `INSERT INTO "${schema}".requerimiento_items 
           (requerimiento_id, producto_id, unidad_medida_id, cantidad, precio_unitario_estimado, precio_total_estimado, observaciones)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            id,
            item.productoId,
            item.unidadMedidaId,
            item.cantidad,
            precioUnitario,
            precioTotal,
            item.observaciones || null,
          );
        }
      }

      // 2. Lógica según acción
      if (dto.accion === 'guardar') {
        // SOLO GUARDAR - Mantiene estado "revision"
        const resultado = await tx.$queryRawUnsafe<Requerimiento[]>(
          `UPDATE "${schema}".requerimientos 
         SET observaciones_aprobador = $1,
             revisado_por = $2,
             fecha_revision = NOW(),
             actualizado_por = $2,
             actualizado_en = NOW()
         WHERE id = $3
         RETURNING *`,
          dto.observaciones || null,
          usuarioId,
          id,
        );
        return resultado[0];
      } else {
        // APROBAR o RECHAZAR - Cambia estado
        const nuevoEstado = dto.accion === 'aprobar' ? 'aprobado' : 'rechazado';
        const camposAdicionales =
          dto.accion === 'aprobar'
            ? ', aprobado_por = $3, fecha_aprobacion = NOW()'
            : ', rechazado_por = $3, fecha_rechazo = NOW()';

        const resultado = await tx.$queryRawUnsafe<Requerimiento[]>(
          `UPDATE "${schema}".requerimientos 
         SET estado = $1, 
             observaciones_aprobador = $2,
             revisado_por = $3,
             fecha_revision = NOW(),
             actualizado_por = $3,
             actualizado_en = NOW()
             ${camposAdicionales}
         WHERE id = $4
         RETURNING *`,
          nuevoEstado,
          dto.observaciones || null,
          usuarioId,
          id,
        );
        return resultado[0];
      }
    });
  }

  async listarAprobados(schema: string): Promise<Requerimiento[]> {
    return await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT r.*, 
         (SELECT SUM(precio_total_estimado) FROM "${schema}".requerimiento_items WHERE requerimiento_id = r.id) as total_estimado
       FROM "${schema}".requerimientos r
       WHERE r.estado = 'aprobado'
       ORDER BY r.creado_en DESC`,
    );
  }

  async eliminar(
    schema: string,
    id: number,
    usuarioId: number,
  ): Promise<{ message: string }> {
    const reqActual = await this.prisma.$queryRawUnsafe<Requerimiento[]>(
      `SELECT * FROM "${schema}".requerimientos WHERE id = $1`,
      id,
    );

    if (!reqActual || reqActual.length === 0) {
      throw new ForbiddenException('Requerimiento no encontrado');
    }

    if (reqActual[0].estado !== 'borrador') {
      throw new BadRequestException(
        'Solo se pueden eliminar requerimientos en borrador',
      );
    }

    if (reqActual[0].creado_por !== usuarioId) {
      throw new ForbiddenException(
        'Solo el creador puede eliminar el requerimiento',
      );
    }

    // Borrado LÓGICO
    await this.prisma.$queryRawUnsafe(
      `UPDATE "${schema}".requerimientos 
     SET estado = 'eliminado', actualizado_por = $1, actualizado_en = NOW()
     WHERE id = $2`,
      usuarioId,
      id,
    );

    return { message: 'Requerimiento eliminado correctamente' };
  }
}
