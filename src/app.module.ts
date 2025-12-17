import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module'; // <--- Importar
import { PrismaModule } from './prisma/prisma.module';
import { UsuariosService } from './usuarios/usuarios.service';
import { UsuariosController } from './usuarios/usuarios.controller';
import { LocalesModule } from './locales/locales.module';
import { RolesModule } from './roles/roles.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PermisosModule } from './permisos/permisos.module';
import { ProductosModule } from './productos/productos.module';
import { UnidadesMedidaModule } from './unidades-medida/unidades-medida.module';
import { CategoriasModule } from './categorias/categorias.module';
import { RequerimientosModule } from './requerimientos/requerimientos.module';
import { EntradasCentralModule } from './entradas-central/entradas-central.module';
import { ProveedoresModule } from './proveedores/proveedores.module';

@Module({
  imports: [
    AuthModule, // <--- ¡TIENE QUE ESTAR AQUÍ!
    PrismaModule,
    LocalesModule,
    RolesModule,
    UsuariosModule,
    PermisosModule,
    ProductosModule,
    UnidadesMedidaModule,
    CategoriasModule,
    RequerimientosModule,
    EntradasCentralModule,
    ProveedoresModule,
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
})
export class AppModule {}
