// src/common/interfaces/database.interfaces.ts

export interface IEmpresa {
  id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  subdominio: string;
  schema_name: string;
  email_facturacion: string;
  plan: string;
  activo: boolean;
  creado_en: Date;
}

export interface IRol {
  id: number;
  empresa_id: number;
  nombre: string;
  es_sistema: boolean;
  creado_en: Date;
}

export interface IUsuario {
  id: number;
  empresa_id: number;
  rol_id: number;
  email: string;
  password: string;
  nombre_completo: string;
  telefono?: string;
  activo: boolean;
  creado_en: Date;
}

export interface ILocal {
  id: number;
  empresa_id: number;
  nombre: string;
  codigo: string;
  tiene_mesas: boolean;
  direccion?: string;
  telefono?: string;
  activo: boolean;
  creado_en: Date;
}

export interface IUsuarioConDetalles extends IUsuario {
  schema_name: string;
  subdominio: string;
  rol_nombre: string;
}

export interface IPermiso {
  id: number;
  codigo: string;
  nombre: string;
  modulo: string;
  descripcion?: string;
}
