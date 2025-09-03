import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Enable CORS
  app.enableCors();

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Lazy Map API')
    .setDescription('API for generating battle maps')
    .setVersion('1.0')
    .addTag('maps')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Start server
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
