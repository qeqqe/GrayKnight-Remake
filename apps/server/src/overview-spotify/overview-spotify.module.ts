import { forwardRef, Module } from '@nestjs/common';
import { OverviewSpotifyController } from './overview-spotify.controller';
import { OverviewSpotifyService } from './overview-spotify.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [OverviewSpotifyController],
  providers: [OverviewSpotifyService],
  exports: [OverviewSpotifyService],
})
export class OverviewSpotifyModule {}
