// src/auth/dto/registro.dto.ts
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export class RegistroDto {
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  ruc: string;

  @IsString()
  @IsNotEmpty()
  razonSocial: string;

  @IsString()
  @IsNotEmpty()
  nombreComercial: string;

  @IsString()
  @IsNotEmpty()
  subdominio: string;

  @IsEmail()
  @IsNotEmpty()
  emailDueno: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  passwordDueno: string;

  @IsString()
  @IsNotEmpty()
  nombreDueno: string;

  @IsEmail()
  @IsNotEmpty()
  emailFacturacion: string;
}
