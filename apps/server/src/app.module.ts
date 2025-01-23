import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma/prisma.service';
import { SpotifyController } from './spotify/spotify.controller';
import { SpotifyModule } from './spotify/spotify.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    SpotifyModule,
  ],
  controllers: [AppController, SpotifyController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
