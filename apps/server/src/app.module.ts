import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { SpotifyModule } from './spotify/spotify.module';
import { OfflineSpotifyModule } from './offline-spotify/offline-spotify.module';
import { OverviewSpotifyModule } from './overview-spotify/overview-spotify.module';
import { SearchSpotifyModule } from './search-spotify/search-spotify.module';
import { RecentSpotifyModule } from './recent-spotify/recent-spotify.module';
import { LibrarySpotifyModule } from './library-spotify/library-spotify.module';
import { StatsSpotifyModule } from './stats-spotify/stats-spotify.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    SpotifyModule,
    OfflineSpotifyModule,
    OverviewSpotifyModule,
    SearchSpotifyModule,
    RecentSpotifyModule,
    LibrarySpotifyModule,
    StatsSpotifyModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
