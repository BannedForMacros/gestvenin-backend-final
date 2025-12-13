// src/common/decorators/permisos.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const RequierePermisos = (...permisos: string[]) =>
  SetMetadata('permisos', permisos);
