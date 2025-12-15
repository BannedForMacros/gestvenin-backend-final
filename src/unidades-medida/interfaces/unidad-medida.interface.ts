// src/unidades-medida/interfaces/unidad-medida.interface.ts
export interface UnidadMedida {
  id: number;
  nombre: string;
  abreviatura: string;
  tipo: string;
  es_base: boolean;
  unidad_base_id: number | null;
  factor_a_base: number | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}
