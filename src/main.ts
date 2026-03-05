import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.enableShutdownHooks();
  configureApp(app);

  // Enable CORS
  const corsOrigin = configService.get<string>('cors.origin');
  app.enableCors({
    origin:
      corsOrigin === '*' ? '*' : corsOrigin?.split(',').map((o) => o.trim()),
    credentials: true,
  });

  const nodeEnv = configService.get<string>('nodeEnv');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Easybaby API')
      .setDescription('The Easybaby API documentation')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = configService.get<number>('port') ?? 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api`);

  process.on('SIGTERM', () => {
    logger.log('SIGTERM signal received: closing HTTP server');
  });

  process.on('SIGINT', () => {
    logger.log('SIGINT signal received: closing HTTP server');
  });
}
void bootstrap();
