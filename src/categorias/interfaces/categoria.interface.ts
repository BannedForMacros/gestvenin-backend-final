// src/categorias/interfaces/categoria.interface.ts
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number;
  actualizado_por: number | null;
}
