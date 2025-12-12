// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. 🔴 IMPORTANTE: Excluir 'docs' del prefijo global
  // Si no haces esto, Nest buscará la ruta en /api/v1/docs y dará 404
  app.setGlobalPrefix('api/v1', {
    exclude: ['docs'],
  });

  app.enableCors(); // Opcional: Recomendado habilitar CORS para evitar otros problemas

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Gestvenin API')
    .setDescription('API para el sistema de gestión de ventas e inventario')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // 2. 🔴 IMPORTANTE: Configuración extra para arreglar los estáticos (CSS/JS)
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: false, // <--- ESTA LÍNEA ES LA MAGIA QUE TE FALTA
    swaggerOptions: {
      persistAuthorization: true, // Opcional: mantiene el token si refrescas la página
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
