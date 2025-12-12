// src/common/interfaces/request-user.interface.ts
import { Request } from 'express';

export interface RequestUser {
  id: number;
  email: string;
  empresaId: number;
  schema: string;
  rol: string;
  locales: number[];
  permisos: string[];
}

export interface RequestWithUser extends Request {
  user: RequestUser;
}
