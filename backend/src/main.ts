import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RequestMethod } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api', { exclude: [{ path: '/', method: RequestMethod.GET }] });
  app.enableCors({ origin: config.get<string>('FRONTEND_URL', 'http://localhost:3000') });
  await app.listen(config.get<string>('PORT', '3002'), '127.0.0.1');
}
void bootstrap();
