// src/entradas-central/interfaces/entrada-central.interface.ts
export interface EntradaCentral {
  id: number;
  codigo: string;
  requerimiento_id: number | null;
  tipo: string;
  proveedor_id: number | null;
  comprobante: string | null;
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
  unidad_medida_id: number;
  cantidad: number; // En la unidad seleccionada
  cantidad_base: number; // Convertida a unidad base
  precio_unitario: number;
  precio_total: number;
}

export interface EntradaCentralCompleta extends EntradaCentral {
  items: EntradaCentralItem[];
}
