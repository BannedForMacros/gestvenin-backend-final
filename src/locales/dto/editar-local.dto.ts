import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class EditarLocalDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  // --- AGREGA ESTO ---
  @IsOptional()
  @IsString()
  codigo?: string;
  // -------------------

  @IsOptional()
  @IsBoolean()
  tieneMesas?: boolean;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
