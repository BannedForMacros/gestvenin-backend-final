// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client'; // Importante: Importar tipos de Prisma
import * as bcrypt from 'bcrypt';
import { RegistroDto } from './dto/registro.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registro(dto: RegistroDto) {
    const schemaName = dto.subdominio.replace(/-/g, '_');
    const hashedPassword = await bcrypt.hash(dto.passwordDueno, 10);

    // Tipamos explícitamente 'tx' como Prisma.TransactionClient
    return await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Crear empresa
        const empresa = await tx.empresa.create({
          data: {
            ruc: dto.ruc,
            razonSocial: dto.razonSocial,
            nombreComercial: dto.nombreComercial,
            subdominio: dto.subdominio,
            schemaName,
            emailFacturacion: dto.emailFacturacion,
          },
        });

        // 2. Crear schema
        await tx.$executeRawUnsafe(
          `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`,
        );

        // 3. Crear rol Dueño
        const rolDueno = await tx.rol.create({
          data: {
            empresaId: empresa.id,
            nombre: 'Dueño',
            esSistema: true,
          },
        });

        // 4. Asignar permisos
        const permisos = await tx.permiso.findMany();
        if (permisos.length > 0) {
          await tx.rolPermiso.createMany({
            data: permisos.map((p) => ({
              rolId: rolDueno.id,
              permisoId: p.id,
              activo: true,
            })),
          });
        }

        // 5. Crear usuario
        const usuario = await tx.usuario.create({
          data: {
            empresaId: empresa.id,
            rolId: rolDueno.id,
            email: dto.emailDueno,
            password: hashedPassword,
            nombreCompleto: dto.nombreDueno,
          },
        });

        // 6. Crear local
        const local = await tx.local.create({
          data: {
            empresaId: empresa.id,
            nombre: 'Principal',
            codigo: 'PRINCIPAL',
            tieneMesas: false,
          },
        });

        // 7. Asignar local
        await tx.usuarioLocal.create({
          data: {
            usuarioId: usuario.id,
            localId: local.id,
          },
        });

        // 8. Crear tablas en schema
        await this.crearTablasEmpresa(tx, schemaName);

        return { message: 'Empresa creada', usuario };
      },
    );
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
      include: {
        empresa: true,
        rol: {
          include: {
            rolPermisos: {
              where: { activo: true },
              include: { permiso: true },
            },
          },
        },
        usuarioLocales: {
          where: { activo: true },
          include: { local: true },
        },
      },
    });

    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const passwordValido = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValido)
      throw new UnauthorizedException('Credenciales inválidas');

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      empresaId: usuario.empresaId,
      schema: usuario.empresa.schemaName,
      rol: usuario.rol.nombre,
      locales: usuario.usuarioLocales.map((ul) => ul.local.id),
      permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol.nombre,
        empresa: {
          subdominio: usuario.empresa.subdominio,
          schema: usuario.empresa.schemaName,
        },
        locales: usuario.usuarioLocales.map((ul) => ul.local),
        permisos: usuario.rol.rolPermisos.map((rp) => rp.permiso.codigo),
      },
    };
  }

  // Tipamos 'tx' correctamente aquí también
  private async crearTablasEmpresa(
    tx: Prisma.TransactionClient,
    schema: string,
  ): Promise<void> {
    // Tabla productos
    await tx.$executeRawUnsafe(`
    CREATE TABLE "${schema}".productos (
      id SERIAL PRIMARY KEY,
      local_id INT,
      nombre VARCHAR(200) NOT NULL,
      precio DECIMAL(10,2) NOT NULL,
      stock INT DEFAULT 0,
      activo BOOLEAN DEFAULT true,
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `);

    // Tabla ventas
    await tx.$executeRawUnsafe(`
    CREATE TABLE "${schema}".ventas (
      id SERIAL PRIMARY KEY,
      local_id INT NOT NULL,
      total DECIMAL(10,2) NOT NULL,
      usuario_id INT NOT NULL,
      creado_en TIMESTAMP DEFAULT NOW()
    )
  `);
  }
}
