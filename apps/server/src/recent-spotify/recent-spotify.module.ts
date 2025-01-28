import { forwardRef, Module } from '@nestjs/common';
import { RecentSpotifyController } from './recent-spotify.controller';
import { RecentSpotifyService } from './recent-spotify.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [RecentSpotifyController],
  providers: [RecentSpotifyService],
})
export class RecentSpotifyModule {}
