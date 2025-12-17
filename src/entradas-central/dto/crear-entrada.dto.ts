// src/entradas-central/dto/crear-entrada.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntradaItemDto } from './entrada-item.dto';

export class CrearEntradaDto {
  @IsString({ message: 'El tipo debe ser un texto' })
  @IsIn(['manual', 'requerimiento'], {
    message: 'El tipo debe ser: manual o requerimiento',
  })
  tipo: string;

  @IsOptional()
  @IsInt({ message: 'El requerimiento debe ser un número' })
  requerimientoId?: number;

  @IsOptional()
  @IsString({ message: 'El proveedor debe ser un texto' })
  proveedor?: string;

  @IsOptional()
  @IsString({ message: 'El comprobante debe ser un texto' })
  comprobante?: string;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;

  @IsArray({ message: 'Los items deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe incluir al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => EntradaItemDto)
  items: EntradaItemDto[];
}
