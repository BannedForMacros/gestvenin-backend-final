// src/entradas-central/entradas-central.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearEntradaDto } from './dto/crear-entrada.dto';
import {
  EntradaCentral,
  EntradaCentralCompleta,
  EntradaCentralItem,
} from './interfaces/entrada-central.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class EntradasCentralService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearEntradaDto,
  ): Promise<EntradaCentralCompleta> {
    // Validar que si es por requerimiento, exista y esté aprobado
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
         (codigo, requerimiento_id, tipo, proveedor, comprobante, total, observaciones, creado_por, actualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        codigo,
        dto.requerimientoId || null,
        dto.tipo,
        dto.proveedor || null,
        dto.comprobante || null,
        total,
        dto.observaciones || null,
        usuarioId,
        usuarioId,
      );

      const entrada = entradaResult[0];

      // 4. Insertar items (el trigger actualizará inventario automáticamente)
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

        const itemResult = await tx.$queryRawUnsafe<EntradaCentralItem[]>(
          `INSERT INTO "${schema}".entrada_central_items 
           (entrada_id, producto_id, unidad_medida_id, cantidad, precio_unitario, precio_total)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          entrada.id,
          item.productoId,
          item.unidadMedidaId,
          item.cantidad,
          item.precioUnitario,
          item.precioTotal,
        );

        items.push(itemResult[0]);
      }

      // 5. Si es por requerimiento, marcarlo como "comprado"
      if (dto.tipo === 'requerimiento' && dto.requerimientoId) {
        await tx.$queryRawUnsafe(
          `UPDATE "${schema}".requerimientos 
           SET estado = 'comprado', actualizado_por = $1, actualizado_en = NOW()
           WHERE id = $2`,
          usuarioId,
          dto.requerimientoId,
        );
      }

      return {
        ...entrada,
        items,
      };
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

    let conditions = 'WHERE 1=1';
    const params: unknown[] = [limit, skip];
    const paramIndex = 3;

    if (search) {
      conditions += ` AND (codigo ILIKE $${paramIndex} OR proveedor ILIKE $${paramIndex})`;
      params.push(searchParam);
    }

    // 1. OBTENER DATOS
    const data = await this.prisma.$queryRawUnsafe<EntradaCentral[]>(
      `SELECT * FROM "${schema}".entradas_central 
       ${conditions}
       ORDER BY creado_en DESC
       LIMIT $1 OFFSET $2`,
      ...params,
    );

    // 2. OBTENER TOTAL
    const countParams: unknown[] = [];
    let countConditions = 'WHERE 1=1';
    const countParamIndex = 1;

    if (search) {
      countConditions += ` AND (codigo ILIKE $${countParamIndex} OR proveedor ILIKE $${countParamIndex})`;
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

    const items = await this.prisma.$queryRawUnsafe<EntradaCentralItem[]>(
      `SELECT ei.*, 
              p.nombre as producto_nombre, 
              p.codigo as producto_codigo,
              um.nombre as unidad_nombre,
              um.abreviatura as unidad_abreviatura
       FROM "${schema}".entrada_central_items ei
       INNER JOIN "${schema}".productos p ON ei.producto_id = p.id
       INNER JOIN "${schema}".unidades_medida um ON ei.unidad_medida_id = um.id
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
