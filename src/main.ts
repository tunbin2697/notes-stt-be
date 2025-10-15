import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { SECURITY_CONFIG } from '@/config/security.config';
import { GraphQLExceptionFilter } from '@/common/filters/graphql-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(cookieParser());

  const raw = SECURITY_CONFIG.cors?.origin ?? '';
  const whitelist = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (whitelist.includes(origin)) return callback(null, true);
      return callback(new Error('CORS policy: origin not allowed'), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalFilters(new GraphQLExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
