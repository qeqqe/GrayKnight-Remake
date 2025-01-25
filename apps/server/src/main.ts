import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);
  const prismaService = app.get(PrismaService);

  app.enableCors({
    origin: [
      configService.get<string>('FRONTEND_URL'),
      'https://gray-knight-remake.vercel.app',
      'https://accounts.spotify.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await prismaService.enableShutdownHooks(app);

  const port =
    process.env.PORT || configService.get<string>('SERVER_PORT') || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Application is running on port ${port}`);
}
bootstrap();
