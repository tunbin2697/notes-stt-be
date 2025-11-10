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
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Allow requests with no origin (like curl, Postman, or internal proxies)
      if (!origin) return callback(null, true);

      // Allow whitelisted origins
      if (whitelist.includes(origin)) return callback(null, true);

      // Allow requests from localhost (internal Nginx proxy)
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Log rejected origins for debugging
      console.warn(`CORS: Blocked origin: ${origin}`);
      return callback(new Error('CORS policy: origin not allowed'), false);
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalFilters(new GraphQLExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);

  console.log(
    `Application is running on: http://localhost:${process.env.PORT ?? 3000}`,
  );
  console.log(`CORS whitelist: ${whitelist.join(', ')}`);

  // console.log('env loaded:', process.env);
}
bootstrap();
