// src/unidades-medida/dto/crear-unidad-medida.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsNumber,
  IsIn,
  Min,
  MaxLength,
} from 'class-validator';

export class CrearUnidadMedidaDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  nombre: string;

  @IsString({ message: 'La abreviatura debe ser un texto' })
  @IsNotEmpty({ message: 'La abreviatura es obligatoria' })
  @MaxLength(10, {
    message: 'La abreviatura no puede tener más de 10 caracteres',
  })
  abreviatura: string;

  @IsString({ message: 'El tipo debe ser un texto' })
  @IsIn(['peso', 'volumen', 'cantidad'], {
    message: 'El tipo debe ser: peso, volumen o cantidad',
  })
  tipo: string;

  @IsBoolean({ message: 'El campo esBase debe ser verdadero o falso' })
  esBase: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'La unidad base debe ser un número' })
  unidadBaseId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'El factor de conversión debe ser un número' })
  @Min(0.0001, { message: 'El factor de conversión debe ser mayor a 0' })
  factorABase?: number;
}
