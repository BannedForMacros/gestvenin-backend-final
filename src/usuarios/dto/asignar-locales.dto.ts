// src/usuarios/dto/asignar-locales.dto.ts
import { IsInt } from 'class-validator';

export class AsignarLocalesDto {
  @IsInt({ each: true })
  localesIds: number[];
}
