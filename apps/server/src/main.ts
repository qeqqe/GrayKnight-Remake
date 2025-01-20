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
    origin:
      configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    credentials: true,
  });

  await prismaService.enableShutdownHooks(app);

  const port = configService.get<string>('PORT') || 3001;
  await app.listen(port);
  logger.log(`🚀 Application is running on: ${await app.getUrl()}`);
  logger.log(`WebSocket server is running on port ${port}`);
}
bootstrap();
