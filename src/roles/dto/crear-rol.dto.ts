// src/roles/dto/crear-rol.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class CrearRolDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;
}
