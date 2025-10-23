import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import {
  DomainErrorFilter,
  GlobalExceptionFilter,
  HttpExceptionFilter,
} from './common/filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Setup global exception filters
  // Order matters: most specific first, most general last
  const logger = app.get('ILogger'); // Get the logger from DI container

  // Register all filters in a single call with correct order
  app.useGlobalFilters(
    new GlobalExceptionFilter(logger),    // Most general (catch-all)
    new HttpExceptionFilter(logger),      // HTTP exceptions
    new DomainErrorFilter(logger)         // Most specific (domain errors)
  );

  // Enable CORS with configuration
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');

  // In development, allow all origins for simplicity
  // In production, restrict to specific origins
  app.enableCors({
    origin: nodeEnv === 'development' || corsOrigin === '*'
      ? true
      : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  // Setup Swagger documentation
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const config = new DocumentBuilder()
    .setTitle('Lazy Map API')
    .setDescription('API for generating battle maps')
    .setVersion('1.0')
    .addTag('maps')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(apiPrefix, app, document);

  // Start server
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}
bootstrap();
