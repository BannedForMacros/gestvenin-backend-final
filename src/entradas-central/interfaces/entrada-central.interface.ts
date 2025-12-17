// src/entradas-central/interfaces/entrada-central.interface.ts
export interface EntradaCentral {
  id: number;
  codigo: string;
  requerimiento_id: number | null;
  tipo: string;
  proveedor: string | null;
  comprobante: string | null;
  total: number;
  observaciones: string | null;
  creado_por: number;
  actualizado_por: number | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface EntradaCentralItem {
  id: number;
  entrada_id: number;
  producto_id: number;
  unidad_medida_id: number;
  cantidad: number;
  precio_total: number;
  precio_unitario: number;
}

export interface EntradaCentralCompleta extends EntradaCentral {
  items: EntradaCentralItem[];
}
