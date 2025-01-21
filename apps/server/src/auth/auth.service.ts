import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(profile: Prisma.UserCreateInput) {
    const user = await this.prisma.user.upsert({
      where: { spotifyId: profile.spotifyId },
      update: {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        displayName: profile.displayName,
        profileUrl: profile.profileUrl,
      },
      create: {
        spotifyId: profile.spotifyId,
        email: profile.email,
        displayName: profile.displayName,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken,
        profileUrl: profile.profileUrl,
      },
    });
    return user;
  }

  async generateToken(user: Prisma.UserCreateInput) {
    return this.jwtService.sign({
      sub: user.id,
      spotifyId: user.spotifyId,
    });
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        spotifyId: true,
        email: true,
        displayName: true,
        profileUrl: true,
      },
    });
    return user;
  }
}
