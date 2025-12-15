// src/productos/dto/editar-producto.dto.ts
import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';

export class EditarProductoDto {
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

  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(200, { message: 'El nombre no puede tener más de 200 caracteres' })
  nombre?: string;

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

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;
}
