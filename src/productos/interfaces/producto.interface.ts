// src/productos/interfaces/producto.interface.ts
export interface Producto {
  id: number;
  codigo: string | null;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  categoria: string | null;
  stock_minimo: number;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}
