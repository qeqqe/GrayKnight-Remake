import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-spotify';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SpotifyStrategy extends PassportStrategy(Strategy, 'spotify') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('SPOTIFY_CLIENT_ID'),
      clientSecret: configService.get('SPOTIFY_CLIENT_SECRET'),
      callbackURL: configService.get('SPOTIFY_CALLBACK_URL'),
      scope: [
        'user-read-email',
        'user-read-private',
        'user-read-recently-played',
        'user-top-read',
        'user-read-currently-playing',
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-library-read',
        'user-library-modify',
      ],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    return {
      spotifyId: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
      accessToken,
      refreshToken,
      profileUrl: profile.photos[0]?.value,
    };
  }
}
