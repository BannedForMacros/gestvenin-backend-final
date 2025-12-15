// src/productos/dto/asignar-unidades.dto.ts
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductoUnidadDto } from './producto-unidad.dto';

export class AsignarUnidadesDto {
  @IsArray({ message: 'Las unidades deben ser un arreglo' })
  @ArrayMinSize(1, { message: 'Debe asignar al menos una unidad de medida' })
  @ValidateNested({ each: true })
  @Type(() => ProductoUnidadDto)
  unidades: ProductoUnidadDto[];
}
