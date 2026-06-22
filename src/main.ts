import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as qs from 'qs';
import { AppModule } from './app.module';
import { AmoresFatiLogger } from './utils/logger';

const isLocalFrontendOrigin = (origin?: string): boolean => {
  if (!origin) return true;

  try {
    const { hostname } = new URL(origin);

    return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(hostname);
  } catch {
    return false;
  }
};

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('query parser', (str: string) =>
    qs.parse(str, { allowDots: true, depth: 5 }),
  );
  app.useBodyParser('json', { limit: '10mb' });
  app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
  const configuredFrontendUrl = process.env.FRONTEND_URL;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        origin === configuredFrontendUrl ||
        (isDevelopment && isLocalFrontendOrigin(origin))
      ) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  // Swagger exposto apenas fora de produção.
  if (isDevelopment) {
    const config = new DocumentBuilder()
      .setTitle('AmoresFati API')
      .setDescription('API criada para o projeto AmoresFati')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Insira o token JWT retornado no login.',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  await app.listen(Number(process.env.PORT));
}
bootstrap().catch((err) => {
  const logger = new AmoresFatiLogger().setContext('Bootstrap');
  logger.critical('Application bootstrap failed', err);
  process.exit(1);
});
