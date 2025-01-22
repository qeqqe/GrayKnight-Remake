import { Injectable, UnauthorizedException } from '@nestjs/common';
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
    const payload = {
      id: user.id,
      spotifyId: user.spotifyId,
      email: user.email,
    };
    return this.jwtService.signAsync(payload);
  }

  async getUserProfile(userId: string) {
    try {
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

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }
}
