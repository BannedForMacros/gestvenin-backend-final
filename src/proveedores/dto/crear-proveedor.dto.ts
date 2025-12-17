// src/proveedores/dto/crear-proveedor.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
} from 'class-validator';

export class CrearProveedorDto {
  @IsString({ message: 'El RUC debe ser un texto' })
  @IsNotEmpty({ message: 'El RUC es obligatorio' })
  @MaxLength(20, { message: 'El RUC no puede tener más de 20 caracteres' })
  ruc: string;

  @IsString({ message: 'La razón social debe ser un texto' })
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  @MaxLength(200, {
    message: 'La razón social no puede tener más de 200 caracteres',
  })
  razonSocial: string;

  @IsOptional()
  @IsString({ message: 'El nombre comercial debe ser un texto' })
  @MaxLength(200, {
    message: 'El nombre comercial no puede tener más de 200 caracteres',
  })
  nombreComercial?: string;

  @IsOptional()
  @IsString({ message: 'La dirección debe ser un texto' })
  direccion?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser un texto' })
  @MaxLength(50, { message: 'El teléfono no puede tener más de 50 caracteres' })
  telefono?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe ser válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El nombre del contacto debe ser un texto' })
  @MaxLength(100, {
    message: 'El nombre del contacto no puede tener más de 100 caracteres',
  })
  contactoNombre?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono del contacto debe ser un texto' })
  @MaxLength(50, {
    message: 'El teléfono del contacto no puede tener más de 50 caracteres',
  })
  contactoTelefono?: string;
}
