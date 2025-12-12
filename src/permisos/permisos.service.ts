// src/permisos/permisos.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PermisosService {
  constructor(private prisma: PrismaService) {}

  async listar() {
    return this.prisma.permiso.findMany({
      orderBy: [{ modulo: 'asc' }, { nombre: 'asc' }],
    });
  }
}
