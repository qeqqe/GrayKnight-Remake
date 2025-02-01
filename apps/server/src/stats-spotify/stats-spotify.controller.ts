import {
  Controller,
  Get,
  Req,
  UseGuards,
  Logger,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { StatsSpotifyService } from './stats-spotify.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt.guard';

@Controller('stats-spotify')
export class StatsSpotifyController {
  private readonly logger = new Logger(StatsSpotifyController.name);

  constructor(private statsService: StatsSpotifyService) {}

  @Get('overview')
  @UseGuards(JwtAuthGuard)
  async getOverviewStats(@Req() req) {
    try {
      if (!req.user?.id) {
        throw new UnauthorizedException('User ID is required');
      }
      return await this.statsService.getOverviewStats(req.user.id);
    } catch (error) {
      this.logger.error('Failed to get overview stats:', error);
      throw new HttpException(
        'Failed to fetch overview stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('genres')
  @UseGuards(JwtAuthGuard)
  async getGenreStats(@Req() req) {
    return this.statsService.getGenereStats(req.user.id);
  }
}
