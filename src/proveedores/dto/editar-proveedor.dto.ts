// src/proveedores/dto/editar-proveedor.dto.ts
import {
  IsString,
  IsOptional,
  IsEmail,
  IsBoolean,
  MaxLength,
} from 'class-validator';

export class EditarProveedorDto {
  @IsOptional()
  @IsString({ message: 'El RUC debe ser un texto' })
  @MaxLength(20, { message: 'El RUC no puede tener más de 20 caracteres' })
  ruc?: string;

  @IsOptional()
  @IsString({ message: 'La razón social debe ser un texto' })
  @MaxLength(200, {
    message: 'La razón social no puede tener más de 200 caracteres',
  })
  razonSocial?: string;

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

  @IsOptional()
  @IsBoolean({ message: 'El campo activo debe ser verdadero o falso' })
  activo?: boolean;
}
