// src/entradas-central/entradas-central.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEntradaDto } from './dto/crear-entrada.dto';
import { EditarEntradaDto } from './dto/editar-entrada.dto';
import {
  EntradaCentral,
  EntradaCentralCompleta,
  EntradaCentralItem,
} from './interfaces/entrada-central.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

// Al inicio del archivo, después de los imports
type PrismaTransaction = Parameters<
  Parameters<PrismaService['$transaction']>[0]
>[0];

@Injectable()
export class EntradasCentralService {
  constructor(private prisma: PrismaService) {}

  // 🔧 FUNCIÓN AUXILIAR: Calcular cantidad en unidad base
  private async calcularCantidadBase(
    tx: PrismaTransaction,
    schema: string,
    productoId: number,
    unidadMedidaId: number,
    cantidad: number,
  ): Promise<number> {
    // 1. Obtener la unidad base del producto
    const unidadBase = await tx.$queryRawUnsafe<{ unidad_medida_id: number }[]>(
      `SELECT unidad_medida_id FROM "${schema}".producto_unidades
       WHERE producto_id = $1 AND es_unidad_base = true AND activo = true`,
      productoId,
    );

    if (!unidadBase || unidadBase.length === 0) {
      throw new BadRequestException(
        'El producto no tiene unidad base definida',
      );
    }

    const unidadBaseId = unidadBase[0].unidad_medida_id;

    // 2. Si ya está en unidad base, retornar la cantidad
    if (unidadMedidaId === unidadBaseId) {
      return cantidad;
    }

    // 3. Obtener factor de conversión
    const unidad = await tx.$queryRawUnsafe<
      { factor_a_base: string | number }[]
    >(
      `SELECT factor_a_base FROM "${schema}".unidades_medida WHERE id = $1`,
      unidadMedidaId,
    );

    if (!unidad || unidad.length === 0 || !unidad[0].factor_a_base) {
      throw new BadRequestException(
        'No se pudo obtener el factor de conversión',
      );
    }

    // 4. Convertir: cantidad × factor (convertir a number si es string)
    const factor =
      typeof unidad[0].factor_a_base === 'string'
        ? parseFloat(unidad[0].factor_a_base)
        : unidad[0].factor_a_base;

    return cantidad * factor;
  }

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearEntradaDto,
  ): Promise<EntradaCentralCompleta> {
    // Validar requerimiento si aplica
    if (dto.tipo === 'requerimiento') {
      if (!dto.requerimientoId) {
        throw new BadRequestException('Debe especificar un requerimiento');
      }

      const req = await this.prisma.$queryRawUnsafe<{ estado: string }[]>(
        `SELECT estado FROM "${schema}".requerimientos WHERE id = $1`,
        dto.requerimientoId,
      );

      if (!req || req.length === 0) {
        throw new ForbiddenException('Requerimiento no encontrado');
      }

      if (req[0].estado !== 'aprobado') {
        throw new BadRequestException(
          'Solo se pueden crear entradas desde requerimientos aprobados',
        );
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Generar código
      const year = new Date().getFullYear();
      const countResult = await tx.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM "${schema}".entradas_central 
         WHERE codigo LIKE 'ENT-${year}-%'`,
      );
      const siguiente = Number(countResult[0].count) + 1;
      const codigo = `ENT-${year}-${String(siguiente).padStart(4, '0')}`;

      // 2. Calcular total
      const total = dto.items.reduce((sum, item) => sum + item.precioTotal, 0);

      // 3. Crear entrada
      const entradaResult = await tx.$queryRawUnsafe<EntradaCentral[]>(
        `INSERT INTO "${schema}".entradas_central 
         (codigo, requerimiento_id, tipo, proveedor_id, comprobante, total, observaciones, creado_por, actualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        codigo,
        dto.requerimientoId || null,
        dto.tipo,
        dto.proveedorId || null,
        dto.comprobante || null,
        total,
        dto.observaciones || null,
        usuarioId,
        usuarioId,
      );

      const entrada = entradaResult[0];

      // 4. Insertar items CON CONVERSIÓN
      const items: EntradaCentralItem[] = [];

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

        // ⭐ CALCULAR CANTIDAD EN UNIDAD BASE
        const cantidadBase = await this.calcularCantidadBase(
          tx,
          schema,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
        );

        const itemResult = await tx.$queryRawUnsafe<EntradaCentralItem[]>(
          `INSERT INTO "${schema}".entrada_central_items 
           (entrada_id, producto_id, unidad_medida_id, cantidad, cantidad_base, precio_unitario, precio_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          entrada.id,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
          cantidadBase,
          item.precioUnitario,
          item.precioTotal,
        );

        items.push(itemResult[0]);
      }

      // 5. Marcar requerimiento como "comprado"
      if (dto.tipo === 'requerimiento' && dto.requerimientoId) {
        await tx.$queryRawUnsafe(
          `UPDATE "${schema}".requerimientos 
           SET estado = 'comprado', actualizado_por = $1, actualizado_en = NOW()
           WHERE id = $2`,
          usuarioId,
          dto.requerimientoId,
        );
      }

      // 6. ⭐ RECALCULAR INVENTARIO
      await tx.$executeRawUnsafe(
        `SELECT "${schema}".recalcular_inventario_central()`,
      );

      return {
        ...entrada,
        items,
      };
    });
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarEntradaDto,
  ): Promise<EntradaCentralCompleta> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Verificar que existe y no está anulada
      const entradaActual = await tx.$queryRawUnsafe<EntradaCentral[]>(
        `SELECT * FROM "${schema}".entradas_central WHERE id = $1`,
        id,
      );

      if (!entradaActual || entradaActual.length === 0) {
        throw new ForbiddenException('Entrada no encontrada');
      }

      if (entradaActual[0].anulado) {
        throw new BadRequestException('No se puede editar una entrada anulada');
      }

      // 2. Calcular nuevo total
      const total = dto.items.reduce((sum, item) => sum + item.precioTotal, 0);

      // 3. Actualizar encabezado
      await tx.$queryRawUnsafe(
        `UPDATE "${schema}".entradas_central 
         SET proveedor_id = $1, 
             comprobante = $2, 
             total = $3, 
             observaciones = $4,
             actualizado_por = $5,
             actualizado_en = NOW()
         WHERE id = $6`,
        dto.proveedorId || null,
        dto.comprobante || null,
        total,
        dto.observaciones || null,
        usuarioId,
        id,
      );

      // 4. Eliminar items anteriores
      await tx.$queryRawUnsafe(
        `DELETE FROM "${schema}".entrada_central_items WHERE entrada_id = $1`,
        id,
      );

      // 5. Insertar nuevos items CON CONVERSIÓN
      const items: EntradaCentralItem[] = [];

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

        // ⭐ CALCULAR CANTIDAD EN UNIDAD BASE
        const cantidadBase = await this.calcularCantidadBase(
          tx,
          schema,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
        );

        const itemResult = await tx.$queryRawUnsafe<EntradaCentralItem[]>(
          `INSERT INTO "${schema}".entrada_central_items 
           (entrada_id, producto_id, unidad_medida_id, cantidad, cantidad_base, precio_unitario, precio_total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          id,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
          cantidadBase,
          item.precioUnitario,
          item.precioTotal,
        );

        items.push(itemResult[0]);
      }

      // 6. ⭐ RECALCULAR INVENTARIO
      await tx.$executeRawUnsafe(
        `SELECT "${schema}".recalcular_inventario_central()`,
      );

      return this.obtenerPorId(schema, id);
    });
  }

  async eliminar(
    schema: string,
    id: number,
    usuarioId: number,
  ): Promise<{ message: string }> {
    return await this.prisma.$transaction(async (tx) => {
      const entrada = await tx.$queryRawUnsafe<EntradaCentral[]>(
        `SELECT * FROM "${schema}".entradas_central WHERE id = $1`,
        id,
      );

      if (!entrada || entrada.length === 0) {
        throw new ForbiddenException('Entrada no encontrada');
      }

      if (entrada[0].anulado) {
        throw new BadRequestException('La entrada ya está anulada');
      }

      // Marcar como anulada
      await tx.$queryRawUnsafe(
        `UPDATE "${schema}".entradas_central 
         SET anulado = true, actualizado_por = $1, actualizado_en = NOW()
         WHERE id = $2`,
        usuarioId,
        id,
      );

      // Si tenía requerimiento, volver a "aprobado"
      if (entrada[0].requerimiento_id) {
        await tx.$queryRawUnsafe(
          `UPDATE "${schema}".requerimientos 
           SET estado = 'aprobado', actualizado_por = $1, actualizado_en = NOW()
           WHERE id = $2`,
          usuarioId,
          entrada[0].requerimiento_id,
        );
      }

      // ⭐ RECALCULAR INVENTARIO (excluye anulados)
      await tx.$executeRawUnsafe(
        `SELECT "${schema}".recalcular_inventario_central()`,
      );

      return { message: 'Entrada eliminada correctamente' };
    });
  }

  async listarPaginado(
    schema: string,
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<PaginatedResponse<EntradaCentral>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    let conditions = 'WHERE anulado = false';
    const params: unknown[] = [limit, skip];
    const paramIndex = 3;

    if (search) {
      conditions += ` AND codigo ILIKE $${paramIndex}`;
      params.push(searchParam);
    }

    const data = await this.prisma.$queryRawUnsafe<EntradaCentral[]>(
      `SELECT * FROM "${schema}".entradas_central 
       ${conditions}
       ORDER BY creado_en DESC
       LIMIT $1 OFFSET $2`,
      ...params,
    );

    const countParams: unknown[] = [];
    let countConditions = 'WHERE anulado = false';
    const countParamIndex = 1;

    if (search) {
      countConditions += ` AND codigo ILIKE $${countParamIndex}`;
      countParams.push(searchParam);
    }

    const totalResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".entradas_central 
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
  ): Promise<EntradaCentralCompleta> {
    const entradaResult = await this.prisma.$queryRawUnsafe<EntradaCentral[]>(
      `SELECT * FROM "${schema}".entradas_central WHERE id = $1`,
      id,
    );

    if (!entradaResult || entradaResult.length === 0) {
      throw new ForbiddenException('Entrada no encontrada');
    }

    // ⭐ OBTENER ITEMS CON INFO COMPLETA
    const items = await this.prisma.$queryRawUnsafe<EntradaCentralItem[]>(
      `SELECT ei.*, 
              p.nombre as producto_nombre, 
              p.codigo as producto_codigo,
              um.nombre as unidad_nombre,
              um.abreviatura as unidad_abreviatura,
              umb.id as unidad_base_id,
              umb.nombre as unidad_base_nombre,
              umb.abreviatura as unidad_base_abreviatura
       FROM "${schema}".entrada_central_items ei
       INNER JOIN "${schema}".productos p ON ei.producto_id = p.id
       INNER JOIN "${schema}".unidades_medida um ON ei.unidad_medida_id = um.id
       INNER JOIN "${schema}".producto_unidades pu ON p.id = pu.producto_id AND pu.es_unidad_base = true
       INNER JOIN "${schema}".unidades_medida umb ON pu.unidad_medida_id = umb.id
       WHERE ei.entrada_id = $1
       ORDER BY ei.id ASC`,
      id,
    );

    return {
      ...entradaResult[0],
      items,
    };
  }
}
