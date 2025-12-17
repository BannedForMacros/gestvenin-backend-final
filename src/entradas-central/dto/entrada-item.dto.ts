// src/entradas-central/dto/entrada-item.dto.ts
import { IsInt, IsNumber, Min } from 'class-validator';

export class EntradaItemDto {
  @IsInt({ message: 'El producto debe ser un número' })
  productoId: number;

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
