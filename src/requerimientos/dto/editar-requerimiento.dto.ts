// src/requerimientos/dto/editar-requerimiento.dto.ts
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RequerimientoItemDto } from './requerimiento-item.dto';

export class EditarRequerimientoDto {
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => RequerimientoItemDto)
  items?: RequerimientoItemDto[];
}
