// src/productos/interfaces/producto.interface.ts
export interface Producto {
  id: number;
  codigo: string | null;
  codigo_barras: string | null;
  nombre: string;
  descripcion: string | null;
  categoria_id: number | null;
  stock_minimo: number;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}

export interface ProductoUnidad {
  id: number;
  producto_id: number;
  unidad_medida_id: number;
  es_unidad_base: boolean;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}

export interface ProductoConUnidades extends Producto {
  unidades: ProductoUnidad[];
}
