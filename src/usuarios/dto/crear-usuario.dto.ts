// src/usuarios/dto/crear-usuario.dto.ts
import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CrearUsuarioDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @IsInt()
  rolId: number;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsInt({ each: true })
  localesIds: number[];
}
