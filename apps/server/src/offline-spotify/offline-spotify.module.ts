import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OfflineSpotifyController } from './offline-spotify.controller';
import { OfflineSpotifyService } from './offline-spotify.service';
import { SpotifyModule } from '../spotify/spotify.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), SpotifyModule, PrismaModule],
  controllers: [OfflineSpotifyController],
  providers: [OfflineSpotifyService],
  exports: [OfflineSpotifyService],
})
export class OfflineSpotifyModule {}
