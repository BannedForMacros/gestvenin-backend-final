// src/requerimientos/dto/requerimiento-item.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RequerimientoItemDto {
  @IsInt({ message: 'El producto debe ser un número' })
  productoId: number;

  @IsInt({ message: 'La unidad de medida debe ser un número' })
  unidadMedidaId: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario debe ser mayor o igual a 0' })
  precioUnitarioEstimado?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio total debe ser un número' })
  @Min(0, { message: 'El precio total debe ser mayor o igual a 0' })
  precioTotalEstimado?: number;

  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto' })
  observaciones?: string;
}
