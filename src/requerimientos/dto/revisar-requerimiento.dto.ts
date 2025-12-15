// src/requerimientos/dto/revisar-requerimiento.dto.ts
import {
  IsString,
  IsIn,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequerimientoItemDto } from './requerimiento-item.dto';

export class RevisarRequerimientoDto {
  @IsString({ message: 'La acción debe ser un texto' })
  @IsIn(['aprobar', 'rechazar'], {
    message: 'La acción debe ser: aprobar o rechazar',
  })
  accion: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsOptional()
  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => RequerimientoItemDto)
  items?: RequerimientoItemDto[];
}
