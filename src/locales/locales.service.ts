// src/locales/locales.service.ts
import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CrearLocalDto } from './dto/crear-local.dto';
import { EditarLocalDto } from './dto/editar-local.dto';

@Injectable()
export class LocalesService {
  constructor(private prisma: PrismaService) {}

  async crear(empresaId: number, dto: CrearLocalDto) {
    return this.prisma.local.create({
      data: {
        empresaId,
        ...dto,
      },
    });
  }

  async listar(empresaId: number) {
    return this.prisma.local.findMany({
      where: { empresaId },
    });
  }

  async editar(id: number, empresaId: number, dto: EditarLocalDto) {
    const local = await this.prisma.local.findFirst({
      where: { id, empresaId },
    });

    if (!local) throw new ForbiddenException('Local no encontrado');

    return this.prisma.local.update({
      where: { id },
      data: dto,
    });
  }
}
