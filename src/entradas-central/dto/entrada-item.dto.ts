// src/entradas-central/dto/entrada-item.dto.ts
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class EntradaItemDto {
  @IsInt({ message: 'El producto debe ser un número' })
  productoId: number;

  @IsOptional()
  @IsInt({ message: 'El proveedor debe ser un número' })
  proveedorId?: number;

  @IsOptional()
  @IsString({ message: 'El comprobante debe ser un texto' })
  comprobante?: string;

  @IsOptional()
  @IsString({ message: 'La fecha de compra debe ser un texto (YYYY-MM-DD)' })
  fechaCompra?: string;

  @IsInt({ message: 'La unidad de medida debe ser un número' })
  unidadMedidaId: number;

  @IsNumber({}, { message: 'La cantidad debe ser un número' })
  @Min(0.01, { message: 'La cantidad debe ser mayor a 0' })
  cantidad: number;

  @IsNumber({}, { message: 'El precio unitario debe ser un número' })
  @Min(0, { message: 'El precio unitario debe ser mayor o igual a 0' })
  precioUnitario: number;

  @IsNumber({}, { message: 'El precio total debe ser un número' })
  @Min(0, { message: 'El precio total debe ser mayor o igual a 0' })
  precioTotal: number;
}
