// src/productos/dto/producto-unidad.dto.ts
import { IsInt, IsBoolean } from 'class-validator';

export class ProductoUnidadDto {
  @IsInt({ message: 'La unidad de medida debe ser un número' })
  unidadMedidaId: number;

  @IsBoolean({ message: 'El campo esUnidadBase debe ser verdadero o falso' })
  esUnidadBase: boolean;
}
