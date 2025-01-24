import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async validateUser(profile: Prisma.UserCreateInput) {
    const user = await this.prisma.user.upsert({
      where: { spotifyId: profile.spotifyId },
      update: {
        accessToken: profile.accessToken,
        country: profile.country,
        refreshToken: profile.refreshToken,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
        tokenExpiry: new Date(Date.now() + 3600 * 1000),
      },
      create: {
        spotifyId: profile.spotifyId,
        email: profile.email,
        displayName: profile.displayName,
        accessToken: profile.accessToken,
        country: profile.country,
        refreshToken: profile.refreshToken,
        profileUrl: profile.profileUrl,
        tokenExpiry: new Date(Date.now() + 3600 * 1000),
      },
    });
    return user;
  }

  async generateToken(user: any) {
    const payload = {
      id: user.id,
      spotifyId: user.spotifyId,
      email: user.email,
    };

    return this.jwtService.signAsync(payload, { expiresIn: '7d' });
  }

  async refreshToken(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // check if token needs refresh (5 minutes before expiry)
    const needsRefresh = user.tokenExpiry
      ? new Date(user.tokenExpiry).getTime() - Date.now() < 300000
      : true;

    if (!needsRefresh) {
      return user.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: user.refreshToken,
          client_id: this.configService.get('SPOTIFY_CLIENT_ID'),
          client_secret: this.configService.get('SPOTIFY_CLIENT_SECRET'),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Spotify refresh token error:', error);
        throw new UnauthorizedException('Failed to refresh token');
      }

      const data = await response.json();

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: data.access_token,
          tokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        },
      });

      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new UnauthorizedException('Failed to refresh token');
    }
  }
}
