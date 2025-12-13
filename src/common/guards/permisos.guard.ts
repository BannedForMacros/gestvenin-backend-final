// src/common/guards/permisos.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestWithUser } from '../interfaces/request-user.interface';

@Injectable()
export class PermisosGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permisosRequeridos = this.reflector.get<string[]>(
      'permisos',
      context.getHandler(),
    );

    if (!permisosRequeridos || permisosRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const usuario = request.user;

    const tienePermiso = permisosRequeridos.some((permiso) =>
      usuario.permisos?.includes(permiso),
    );

    if (!tienePermiso) {
      throw new ForbiddenException({
        statusCode: 403,
        message: 'No tienes permisos para esta acción',
        error: 'Forbidden',
        permisosRequeridos: permisosRequeridos,
        permisosFaltantes: permisosRequeridos.filter(
          (p) => !usuario.permisos?.includes(p),
        ),
      });
    }

    return true;
  }
}
