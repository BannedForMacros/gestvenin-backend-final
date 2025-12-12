// src/roles/roles.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearRolDto } from './dto/crear-rol.dto';
import { AsignarPermisosDto } from './dto/asignar-permisos.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async crear(empresaId: number, dto: CrearRolDto) {
    return this.prisma.rol.create({
      data: {
        empresaId,
        nombre: dto.nombre,
        esSistema: false,
      },
    });
  }

  async listar(empresaId: number) {
    return this.prisma.rol.findMany({
      where: { empresaId },
      include: {
        rolPermisos: {
          where: { activo: true },
          include: { permiso: true },
        },
      },
    });
  }

  async asignarPermisos(
    rolId: number,
    empresaId: number,
    dto: AsignarPermisosDto,
  ) {
    const rol = await this.prisma.rol.findFirst({
      where: { id: rolId, empresaId },
    });

    if (!rol) throw new ForbiddenException('Rol no encontrado');

    return await this.prisma.$transaction(async (tx) => {
      await tx.rolPermiso.deleteMany({ where: { rolId } });

      await tx.rolPermiso.createMany({
        data: dto.permisosIds.map((permisoId) => ({
          rolId,
          permisoId,
          activo: true,
        })),
      });

      return { message: 'Permisos asignados' };
    });
  }
}
