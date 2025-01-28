import { forwardRef, Module } from '@nestjs/common';
import { SearchSpotifyController } from './search-spotify.controller';
import { SearchSpotifyService } from './search-spotify.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [SearchSpotifyController],
  providers: [SearchSpotifyService],
})
export class SearchSpotifyModule {}
