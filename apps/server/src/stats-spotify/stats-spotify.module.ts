import { forwardRef, Module } from '@nestjs/common';
import { StatsSpotifyController } from './stats-spotify.controller';
import { StatsSpotifyService } from './stats-spotify.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [StatsSpotifyController],
  providers: [StatsSpotifyService],
})
export class StatsSpotifyModule {}
