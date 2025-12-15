// src/productos/dto/crear-producto.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
  Min,
  MaxLength,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProductoUnidadDto } from './producto-unidad.dto';

export class CrearProductoDto {
  @IsOptional()
  @IsString({ message: 'El código debe ser un texto' })
  @MaxLength(50, { message: 'El código no puede tener más de 50 caracteres' })
  codigo?: string;

  @IsOptional()
  @IsString({ message: 'El código de barras debe ser un texto' })
  @MaxLength(100, {
    message: 'El código de barras no puede tener más de 100 caracteres',
  })
  codigoBarras?: string;

  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(200, { message: 'El nombre no puede tener más de 200 caracteres' })
  nombre: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  descripcion?: string;

  @IsOptional()
  @IsInt({ message: 'La categoría debe ser un número' })
  categoriaId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El stock mínimo debe ser un número' })
  @Min(0, { message: 'El stock mínimo debe ser mayor o igual a 0' })
  stockMinimo?: number;

  @IsArray({ message: 'Las unidades deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos una unidad de medida' })
  @ValidateNested({ each: true })
  @Type(() => ProductoUnidadDto)
  unidades: ProductoUnidadDto[];
}
