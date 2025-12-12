// src/roles/dto/asignar-permisos.dto.ts
import { IsInt } from 'class-validator';

export class AsignarPermisosDto {
  @IsInt({ each: true })
  permisosIds: number[];
}
