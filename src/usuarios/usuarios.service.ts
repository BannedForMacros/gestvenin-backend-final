// src/usuarios/usuarios.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { EditarUsuarioDto } from './dto/editar-usuario.dto';
import { AsignarLocalesDto } from './dto/asignar-locales.dto';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async crear(empresaId: number, dto: CrearUsuarioDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return await this.prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          empresaId,
          rolId: dto.rolId,
          email: dto.email,
          password: hashedPassword,
          nombreCompleto: dto.nombreCompleto,
          telefono: dto.telefono,
        },
      });

      await tx.usuarioLocal.createMany({
        data: dto.localesIds.map((localId) => ({
          usuarioId: usuario.id,
          localId,
        })),
      });

      return usuario;
    });
  }

  async listar(empresaId: number) {
    const usuarios = await this.prisma.usuario.findMany({
      where: { empresaId },
      include: {
        rol: true,
        usuarioLocales: {
          include: { local: true },
        },
      },
    });

    // TRANSFORMACIÓN DE DATOS (Mapeo)
    return usuarios.map((usuario) => ({
      ...usuario,
      // 1. Aplanamos el rol para enviar solo el nombre (o el objeto si prefieres, pero ajusta el tipo en frontend)
      rol: usuario.rol.nombre,

      // 2. IMPORTANTE: Extraemos los locales limpios de la relación intermedia
      locales: usuario.usuarioLocales.map((ul) => ul.local),

      // 3. Eliminamos la propiedad 'usuarioLocales' para no ensuciar la respuesta
      usuarioLocales: undefined,
    }));
  }

  async editar(id: number, empresaId: number, dto: EditarUsuarioDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId },
    });

    if (!usuario) throw new ForbiddenException('Usuario no encontrado');

    return this.prisma.usuario.update({
      where: { id },
      data: dto,
    });
  }

  async asignarLocales(id: number, empresaId: number, dto: AsignarLocalesDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId },
    });

    if (!usuario) throw new ForbiddenException('Usuario no encontrado');

    return await this.prisma.$transaction(async (tx) => {
      await tx.usuarioLocal.deleteMany({ where: { usuarioId: id } });

      await tx.usuarioLocal.createMany({
        data: dto.localesIds.map((localId) => ({
          usuarioId: id,
          localId,
        })),
      });

      return { message: 'Locales asignados' };
    });
  }
}
