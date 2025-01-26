import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const secret = this.configService.get<string>('JWT_SECRET');
    this.encryptionKey = crypto.scryptSync(secret, 'salt', 32);
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${encrypted.toString('hex')}:${tag.toString('hex')}`;
  }

  private decrypt(hash: string): string {
    const [ivHex, encryptedHex, tagHex] = hash.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
  }

  async validateUser(profile: Prisma.UserCreateInput) {
    // encrypt tokens before storing
    const encryptedAccessToken = this.encrypt(profile.accessToken);
    const encryptedRefreshToken = this.encrypt(profile.refreshToken);

    const user = await this.prisma.user.upsert({
      where: { spotifyId: profile.spotifyId },
      update: {
        accessToken: encryptedAccessToken,
        country: profile.country,
        refreshToken: encryptedRefreshToken,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
        tokenExpiry: new Date(Date.now() + 3600 * 1000),
      },
      create: {
        spotifyId: profile.spotifyId,
        email: profile.email,
        displayName: profile.displayName,
        accessToken: encryptedAccessToken,
        country: profile.country,
        refreshToken: encryptedRefreshToken,
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
      select: {
        refreshToken: true,
        accessToken: true,
        tokenExpiry: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Decrypt the stored tokens
    const decryptedAccessToken = this.decrypt(user.accessToken);
    const decryptedRefreshToken = this.decrypt(user.refreshToken);

    const needsRefresh = user.tokenExpiry
      ? new Date(user.tokenExpiry).getTime() - Date.now() < 300000
      : true;

    if (!needsRefresh) {
      return decryptedAccessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: decryptedRefreshToken,
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
      const encryptedNewAccessToken = this.encrypt(data.access_token);

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          accessToken: encryptedNewAccessToken,
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
