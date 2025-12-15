// src/unidades-medida/unidades-medida.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearUnidadMedidaDto } from './dto/crear-unidad-medida.dto';
import { EditarUnidadMedidaDto } from './dto/editar-unidad-medida.dto';
import { UnidadMedida } from './interfaces/unidad-medida.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class UnidadesMedidaService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    // Validar coherencia
    if (dto.esBase && (dto.unidadBaseId || dto.factorABase)) {
      throw new BadRequestException(
        'Una unidad base no puede tener unidad_base_id ni factor_a_base',
      );
    }

    if (!dto.esBase && (!dto.unidadBaseId || !dto.factorABase)) {
      throw new BadRequestException(
        'Una unidad derivada debe tener unidad_base_id y factor_a_base',
      );
    }

    const resultado = await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `INSERT INTO "${schema}".unidades_medida
       (nombre, abreviatura, tipo, es_base, unidad_base_id, factor_a_base, creado_por, actualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
      dto.nombre,
      dto.abreviatura,
      dto.tipo,
      dto.esBase,
      dto.unidadBaseId || null,
      dto.factorABase || null,
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
    tipo?: string,
  ): Promise<PaginatedResponse<UnidadMedida>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    // Construir condiciones dinámicas
    let conditions = 'WHERE activo = true';
    const params: unknown[] = [limit, skip];
    let paramIndex = 3;

    if (tipo) {
      conditions += ` AND tipo = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }

    if (search) {
      conditions += ` AND (nombre ILIKE $${paramIndex} OR abreviatura ILIKE $${paramIndex})`;
      params.push(searchParam);
    }

    // 1. OBTENER DATOS
    const data = await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `SELECT * FROM "${schema}".unidades_medida 
       ${conditions}
       ORDER BY tipo, es_base DESC, nombre ASC
       LIMIT $1 OFFSET $2`,
      ...params,
    );

    // 2. OBTENER TOTAL
    const countParams: unknown[] = [];
    let countConditions = 'WHERE activo = true';
    let countParamIndex = 1;

    if (tipo) {
      countConditions += ` AND tipo = $${countParamIndex}`;
      countParams.push(tipo);
      countParamIndex++;
    }

    if (search) {
      countConditions += ` AND (nombre ILIKE $${countParamIndex} OR abreviatura ILIKE $${countParamIndex})`;
      countParams.push(searchParam);
    }

    const totalResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".unidades_medida 
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

  // Mantener método original para compatibilidad
  async listar(schema: string): Promise<UnidadMedida[]> {
    return await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `SELECT * FROM "${schema}".unidades_medida 
       WHERE activo = true 
       ORDER BY tipo, es_base DESC, nombre ASC`,
    );
  }

  async obtenerPorId(schema: string, id: number): Promise<UnidadMedida> {
    const resultado = await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `SELECT * FROM "${schema}".unidades_medida WHERE id = $1`,
      id,
    );

    if (!resultado || resultado.length === 0) {
      throw new ForbiddenException('Unidad de medida no encontrada');
    }

    return resultado[0];
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarUnidadMedidaDto,
  ): Promise<UnidadMedida> {
    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (dto.nombre !== undefined) {
      campos.push(`nombre = $${idx++}`);
      valores.push(dto.nombre);
    }
    if (dto.abreviatura !== undefined) {
      campos.push(`abreviatura = $${idx++}`);
      valores.push(dto.abreviatura);
    }
    if (dto.tipo !== undefined) {
      campos.push(`tipo = $${idx++}`);
      valores.push(dto.tipo);
    }
    if (dto.esBase !== undefined) {
      campos.push(`es_base = $${idx++}`);
      valores.push(dto.esBase);
    }
    if (dto.unidadBaseId !== undefined) {
      campos.push(`unidad_base_id = $${idx++}`);
      valores.push(dto.unidadBaseId);
    }
    if (dto.factorABase !== undefined) {
      campos.push(`factor_a_base = $${idx++}`);
      valores.push(dto.factorABase);
    }
    if (dto.activo !== undefined) {
      campos.push(`activo = $${idx++}`);
      valores.push(dto.activo);
    }

    campos.push(`actualizado_por = $${idx++}`);
    valores.push(usuarioId);
    campos.push(`actualizado_en = NOW()`);

    valores.push(id);

    const resultado = await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `UPDATE "${schema}".unidades_medida 
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
  ): Promise<UnidadMedida> {
    const resultado = await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `UPDATE "${schema}".unidades_medida 
       SET activo = false, actualizado_por = $1, actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      usuarioId,
      id,
    );

    return resultado[0];
  }

  async listarPorTipo(schema: string, tipo: string): Promise<UnidadMedida[]> {
    return await this.prisma.$queryRawUnsafe<UnidadMedida[]>(
      `SELECT * FROM "${schema}".unidades_medida
       WHERE tipo = $1 AND activo = true
       ORDER BY es_base DESC, nombre ASC`,
      tipo,
    );
  }
}
