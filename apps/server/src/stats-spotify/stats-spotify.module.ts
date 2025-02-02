import { Module } from '@nestjs/common';
import { StatsSpotifyService } from './stats-spotify.service';
import { StatsSpotifyController } from './stats-spotify.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [StatsSpotifyController],
  providers: [StatsSpotifyService],
})
export class StatsSpotifyModule {}
