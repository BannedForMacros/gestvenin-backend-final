// src/entradas-central/interfaces/entrada-central.interface.ts
export interface EntradaCentral {
  id: number;
  requerimiento_id: number | null;
  tipo: string;
  total: number;
  observaciones: string | null;
  anulado: boolean;
  creado_por: number;
  actualizado_por: number | null;
  creado_en: Date;
  actualizado_en: Date;
}

export interface EntradaCentralItem {
  id: number;
  entrada_id: number;
  producto_id: number;
  proveedor_id: number | null;
  comprobante: string | null;
  fecha_compra: Date;
  unidad_medida_id: number;
  cantidad: number;
  cantidad_base: number;
  precio_unitario: number;
  precio_total: number;
  creado_en: Date;
}

export interface EntradaCentralCompleta extends EntradaCentral {
  items: EntradaCentralItem[];
}
