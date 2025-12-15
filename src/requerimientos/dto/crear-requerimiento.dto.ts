// src/requerimientos/dto/crear-requerimiento.dto.ts
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RequerimientoItemDto } from './requerimiento-item.dto';

export class CrearRequerimientoDto {
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => RequerimientoItemDto)
  items: RequerimientoItemDto[];
}
