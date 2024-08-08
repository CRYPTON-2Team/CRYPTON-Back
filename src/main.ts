import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: 'http://127.0.0.1:5500',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,X-Original-Filename',
    exposedHeaders: 'X-Original-Filename',
  });
  await app.listen(3000);
}
bootstrap();
