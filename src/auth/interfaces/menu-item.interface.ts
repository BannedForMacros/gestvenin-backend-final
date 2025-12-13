// src/auth/interfaces/menu-item.interface.ts
export interface MenuItemDB {
  id: number;
  codigo: string;
  titulo: string;
  icono: string | null;
  ruta: string | null;
  parent_id: number | null;
  orden: number;
  permiso_requerido: string | null;
  activo: boolean;
}

export interface MenuItemResponse {
  id: number;
  codigo: string;
  titulo: string;
  icono: string | null;
  ruta: string | null;
  hijos: MenuItemResponse[];
}
