import { forwardRef, Module } from '@nestjs/common';
import { LibrarySpotifyController } from './library-spotify.controller';
import { LibrarySpotifyService } from './library-spotify.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [LibrarySpotifyController],
  providers: [LibrarySpotifyService],
})
export class LibrarySpotifyModule {}
