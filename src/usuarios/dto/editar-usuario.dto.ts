// src/usuarios/dto/editar-usuario.dto.ts
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class EditarUsuarioDto {
  @IsOptional()
  @IsString()
  nombreCompleto?: string;

  @IsOptional()
  @IsInt()
  rolId?: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
