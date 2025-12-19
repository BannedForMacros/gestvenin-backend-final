// src/entradas-central/dto/editar-entrada.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EntradaItemDto } from './entrada-item.dto';

export class EditarEntradaDto {
  @IsOptional()
  @IsInt({ message: 'El proveedor debe ser un número' })
  proveedorId?: number;

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
