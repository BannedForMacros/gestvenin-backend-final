// src/requerimientos/interfaces/requerimiento.interface.ts
export interface Requerimiento {
  id: number;
  codigo: string;
  tipo: string;
  estado: string;
  observaciones: string | null;
  observaciones_aprobador: string | null;
  creado_por: number;
  enviado_revision_por: number | null;
  fecha_envio_revision: Date | null;
  aprobado_por: number | null;
  fecha_aprobacion: Date | null;
  rechazado_por: number | null;
  fecha_rechazo: Date | null;
  revisado_por: number | null;
  fecha_revision: Date | null;
  creado_en: Date;
  actualizado_en: Date;
  actualizado_por: number | null;
}

export interface RequerimientoItem {
  id: number;
  requerimiento_id: number;
  producto_id: number;
  unidad_medida_id: number;
  cantidad: number;
  precio_unitario_estimado: number | null;
  precio_total_estimado: number | null;
  observaciones: string | null;
}

export interface RequerimientoCompleto extends Requerimiento {
  items: RequerimientoItem[];
}
