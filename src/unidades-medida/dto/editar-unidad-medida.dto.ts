// src/unidades-medida/dto/editar-unidad-medida.dto.ts
import {
  IsString,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

export class EditarUnidadMedidaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  nombre?: string;

  @IsOptional()
  @IsString({ message: 'La abreviatura debe ser un texto' })
  @MaxLength(10, {
    message: 'La abreviatura no puede tener más de 10 caracteres',
  })
  abreviatura?: string;

  @IsOptional()
  @IsString({ message: 'El tipo debe ser un texto' })
  @IsIn(['peso', 'volumen', 'cantidad'], {
    message: 'El tipo debe ser: peso, volumen o cantidad',
  })
  tipo?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo esBase debe ser verdadero o falso' })
  esBase?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'La unidad base debe ser un número' })
  unidadBaseId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El factor de conversión debe ser un número' })
  @Min(0.0001, { message: 'El factor de conversión debe ser mayor a 0' })
  factorABase?: number;

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;
}
