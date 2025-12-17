// src/proveedores/proveedores.service.ts
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { EditarProveedorDto } from './dto/editar-proveedor.dto';
import { Proveedor } from './interfaces/proveedor.interface';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Injectable()
export class ProveedoresService {
  constructor(private prisma: PrismaService) {}

  async crear(
    schema: string,
    usuarioId: number,
    dto: CrearProveedorDto,
  ): Promise<Proveedor> {
    // Verificar si el RUC ya existe
    const existe = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".proveedores WHERE ruc = $1`,
      dto.ruc,
    );

    if (Number(existe[0].count) > 0) {
      throw new BadRequestException('El RUC ya está registrado');
    }

    const resultado = await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `INSERT INTO "${schema}".proveedores 
       (ruc, razon_social, nombre_comercial, direccion, telefono, email, contacto_nombre, contacto_telefono, creado_por, actualizado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      dto.ruc,
      dto.razonSocial,
      dto.nombreComercial || null,
      dto.direccion || null,
      dto.telefono || null,
      dto.email || null,
      dto.contactoNombre || null,
      dto.contactoTelefono || null,
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
  ): Promise<PaginatedResponse<Proveedor>> {
    const skip = (page - 1) * limit;
    const searchParam = search ? `%${search}%` : null;

    let conditions = 'WHERE activo = true';
    const params: unknown[] = [limit, skip];
    const paramIndex = 3;

    if (search) {
      conditions += ` AND (ruc ILIKE $${paramIndex} OR razon_social ILIKE $${paramIndex} OR nombre_comercial ILIKE $${paramIndex})`;
      params.push(searchParam);
    }

    const data = await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `SELECT * FROM "${schema}".proveedores 
       ${conditions}
       ORDER BY razon_social ASC
       LIMIT $1 OFFSET $2`,
      ...params,
    );

    const countParams: unknown[] = [];
    let countConditions = 'WHERE activo = true';
    const countParamIndex = 1;

    if (search) {
      countConditions += ` AND (ruc ILIKE $${countParamIndex} OR razon_social ILIKE $${countParamIndex} OR nombre_comercial ILIKE $${countParamIndex})`;
      countParams.push(searchParam);
    }

    const totalResult = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "${schema}".proveedores 
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

  async listarActivos(schema: string): Promise<Proveedor[]> {
    return await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `SELECT * FROM "${schema}".proveedores 
       WHERE activo = true 
       ORDER BY razon_social ASC`,
    );
  }

  async obtenerPorId(schema: string, id: number): Promise<Proveedor> {
    const resultado = await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `SELECT * FROM "${schema}".proveedores WHERE id = $1`,
      id,
    );

    if (!resultado || resultado.length === 0) {
      throw new ForbiddenException('Proveedor no encontrado');
    }

    return resultado[0];
  }

  async editar(
    schema: string,
    id: number,
    usuarioId: number,
    dto: EditarProveedorDto,
  ): Promise<Proveedor> {
    // Si se cambia el RUC, verificar que no exista
    if (dto.ruc) {
      const existe = await this.prisma.$queryRawUnsafe<{ count: bigint }[]>(
        `SELECT COUNT(*) as count FROM "${schema}".proveedores 
         WHERE ruc = $1 AND id != $2`,
        dto.ruc,
        id,
      );

      if (Number(existe[0].count) > 0) {
        throw new BadRequestException(
          'El RUC ya está registrado en otro proveedor',
        );
      }
    }

    const campos: string[] = [];
    const valores: unknown[] = [];
    let idx = 1;

    if (dto.ruc !== undefined) {
      campos.push(`ruc = $${idx++}`);
      valores.push(dto.ruc);
    }
    if (dto.razonSocial !== undefined) {
      campos.push(`razon_social = $${idx++}`);
      valores.push(dto.razonSocial);
    }
    if (dto.nombreComercial !== undefined) {
      campos.push(`nombre_comercial = $${idx++}`);
      valores.push(dto.nombreComercial);
    }
    if (dto.direccion !== undefined) {
      campos.push(`direccion = $${idx++}`);
      valores.push(dto.direccion);
    }
    if (dto.telefono !== undefined) {
      campos.push(`telefono = $${idx++}`);
      valores.push(dto.telefono);
    }
    if (dto.email !== undefined) {
      campos.push(`email = $${idx++}`);
      valores.push(dto.email);
    }
    if (dto.contactoNombre !== undefined) {
      campos.push(`contacto_nombre = $${idx++}`);
      valores.push(dto.contactoNombre);
    }
    if (dto.contactoTelefono !== undefined) {
      campos.push(`contacto_telefono = $${idx++}`);
      valores.push(dto.contactoTelefono);
    }
    if (dto.activo !== undefined) {
      campos.push(`activo = $${idx++}`);
      valores.push(dto.activo);
    }

    campos.push(`actualizado_por = $${idx++}`);
    valores.push(usuarioId);
    campos.push(`actualizado_en = NOW()`);

    valores.push(id);

    const resultado = await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `UPDATE "${schema}".proveedores 
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
  ): Promise<Proveedor> {
    const resultado = await this.prisma.$queryRawUnsafe<Proveedor[]>(
      `UPDATE "${schema}".proveedores 
       SET activo = false, actualizado_por = $1, actualizado_en = NOW()
       WHERE id = $2
       RETURNING *`,
      usuarioId,
      id,
    );

    return resultado[0];
  }
}
