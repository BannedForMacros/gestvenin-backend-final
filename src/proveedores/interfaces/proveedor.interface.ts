// src/proveedores/interfaces/proveedor.interface.ts
export interface Proveedor {
  id: number;
  ruc: string;
  razon_social: string;
  nombre_comercial: string | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contacto_nombre: string | null;
  contacto_telefono: string | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}
