import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SpotifyAuthGuard } from './guards/spotify-auth.guard';
import { SpotifyStrategy } from './strategies/spotify.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './strategies/jwt.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Changed to jwt
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    SpotifyAuthGuard,
    SpotifyStrategy,
    JwtStrategy,
    JwtAuthGuard,
  ],
})
export class AuthModule {}
