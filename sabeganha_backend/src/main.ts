import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Prefix
  app.setGlobalPrefix('api/v1', { exclude: ['/', 'health'] });

  // Direct root & health check handlers on Express
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.get('/', (req, res) => {
    res.json({
      name: 'SabeGanha Core API',
      version: '1.0.0',
      status: 'online',
      docs: '/api/docs',
    });
  });
  expressInstance.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // OpenAPI / Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('SabeGanha Core API')
    .setDescription('Documentação dos serviços REST do SabeGanha (Quizzes, Ledger e Recompensas)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 SabeGanha API rodando na porta ${port} no ambiente ${process.env.NODE_ENV || 'development'}`);
  logger.log(`📖 Documentação Swagger disponível em: http://localhost:${port}/api/docs`);

  if (Number(port) !== 80) {
    try {
      const http = await import('http');
      const fallbackServer = http.createServer(expressInstance);
      fallbackServer.listen(80, '0.0.0.0', () => {
        logger.log(`🌐 Fallback HTTP listener ativo também na porta 80`);
      });
    } catch (e: any) {
      logger.warn(`Fallback na porta 80 não iniciado: ${e?.message}`);
    }
  }
}
bootstrap();

