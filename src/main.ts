import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigModule } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  ConfigModule.forRoot({ isGlobal: true });
  const app = await NestFactory.create(AppModule);

  console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
  console.log('AWS_REGION:', process.env.AWS_REGION);
  ConfigModule.forRoot({ isGlobal: true });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization,X-Original-Filename',
    exposedHeaders: 'X-Original-Filename',
  });

  const config = new DocumentBuilder()
    .setTitle('Auth API')
    .setDescription('The Auth API description')
    .setVersion('1.0')
    .addTag('인증')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
