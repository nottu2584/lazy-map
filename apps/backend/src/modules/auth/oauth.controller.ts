import {
  CompleteDiscordSignInCommand,
  CompleteDiscordSignInUseCase,
  CompleteGoogleSignInCommand,
  CompleteGoogleSignInUseCase,
  InitiateDiscordSignInCommand,
  InitiateDiscordSignInUseCase,
  InitiateGoogleSignInCommand,
  InitiateGoogleSignInUseCase,
} from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';
import {
  BadRequestException,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Query,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getAccessCookieOptions,
  getRefreshCookieOptions,
} from '../../common/auth';

@ApiTags('oauth')
@Controller('auth')
export class OAuthController {
  private readonly frontendUrl: string;

  constructor(
    private readonly initiateGoogleSignInUseCase: InitiateGoogleSignInUseCase,
    private readonly completeGoogleSignInUseCase: CompleteGoogleSignInUseCase,
    private readonly initiateDiscordSignInUseCase: InitiateDiscordSignInUseCase,
    private readonly completeDiscordSignInUseCase: CompleteDiscordSignInUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    configService: ConfigService,
  ) {
    const allowedUrls = configService.get<string>('ALLOWED_FRONTEND_URLS', 'http://localhost:5173');
    this.frontendUrl = allowedUrls.split(',')[0].trim();
  }

  @Get('google/login')
  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Initiate Google OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to generate authorization URL',
  })
  async initiateGoogleSignIn(
    @Query('state') state?: string,
  ): Promise<{ authorizationUrl: string }> {
    const operationLogger = this.logger.child({
      component: 'OAuthController',
      operation: 'initiateGoogleSignIn',
    });

    try {
      operationLogger.info('Initiating Google OAuth sign-in', {
        metadata: { hasState: !!state },
      });

      const command = new InitiateGoogleSignInCommand('', state);
      const result = await this.initiateGoogleSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to initiate Google sign-in', {
          metadata: { errors: result.errors },
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Google authorization URL generated successfully');

      return {
        authorizationUrl: result.authorizationUrl!,
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to initiate Google sign-in: ' + message);
    }
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Complete Google OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth sign-in completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OAuth callback',
  })
  async completeGoogleSignIn(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const operationLogger = this.logger.child({
      component: 'OAuthController',
      operation: 'completeGoogleSignIn',
    });

    try {
      if (!code) {
        throw new BadRequestException('code query parameter is required');
      }

      operationLogger.info('Completing Google OAuth sign-in', {
        metadata: { hasState: !!state },
      });

      const command = new CompleteGoogleSignInCommand(code, '', state);
      const result = await this.completeGoogleSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Google OAuth sign-in failed', {
          metadata: { errors: result.errors },
        });

        const params = new URLSearchParams({
          status: 'error',
          provider: 'google',
          error: result.errors.join(', '),
        });
        res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
        return;
      }

      operationLogger.info('Google OAuth sign-in completed successfully', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
        },
      });

      res.cookie(ACCESS_COOKIE_NAME, result.token!, getAccessCookieOptions());
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken!, getRefreshCookieOptions());

      const params = new URLSearchParams({
        status: 'success',
        provider: 'google',
        id: result.user!.id.value,
        email: result.user!.email.value,
        username: result.user!.username.value,
      });
      if (result.user!.profilePicture) {
        params.set('avatarUrl', result.user!.profilePicture);
      }
      res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage =
        error instanceof BadRequestException
          ? error.message
          : 'OAuth sign-in failed: ' + (error instanceof Error ? error.message : 'Unknown error');

      const params = new URLSearchParams({
        status: 'error',
        provider: 'google',
        error: errorMessage,
      });
      res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
    }
  }

  @Get('discord/login')
  @Throttle({ long: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Initiate Discord OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to generate authorization URL',
  })
  async initiateDiscordSignIn(
    @Query('state') state?: string,
  ): Promise<{ authorizationUrl: string }> {
    const operationLogger = this.logger.child({
      component: 'OAuthController',
      operation: 'initiateDiscordSignIn',
    });

    try {
      operationLogger.info('Initiating Discord OAuth sign-in', {
        metadata: { hasState: !!state },
      });

      const command = new InitiateDiscordSignInCommand('', state);
      const result = await this.initiateDiscordSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to initiate Discord sign-in', {
          metadata: { errors: result.errors },
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Discord authorization URL generated successfully');

      return {
        authorizationUrl: result.authorizationUrl!,
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to initiate Discord sign-in: ' + message);
    }
  }

  @Get('discord/callback')
  @ApiOperation({ summary: 'Complete Discord OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'OAuth sign-in completed successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid OAuth callback',
  })
  async completeDiscordSignIn(
    @Query('code') code: string,
    @Query('state') state: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const operationLogger = this.logger.child({
      component: 'OAuthController',
      operation: 'completeDiscordSignIn',
    });

    try {
      if (!code) {
        throw new BadRequestException('code query parameter is required');
      }

      operationLogger.info('Completing Discord OAuth sign-in', {
        metadata: { hasState: !!state },
      });

      const command = new CompleteDiscordSignInCommand(code, '', state);
      const result = await this.completeDiscordSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Discord OAuth sign-in failed', {
          metadata: { errors: result.errors },
        });

        const params = new URLSearchParams({
          status: 'error',
          provider: 'discord',
          error: result.errors.join(', '),
        });
        res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
        return;
      }

      operationLogger.info('Discord OAuth sign-in completed successfully', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
        },
      });

      res.cookie(ACCESS_COOKIE_NAME, result.token!, getAccessCookieOptions());
      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken!, getRefreshCookieOptions());

      const params = new URLSearchParams({
        status: 'success',
        provider: 'discord',
        id: result.user!.id.value,
        email: result.user!.email.value,
        username: result.user!.username.value,
      });
      if (result.user!.profilePicture) {
        params.set('avatarUrl', result.user!.profilePicture);
      }
      res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage =
        error instanceof BadRequestException
          ? error.message
          : 'OAuth sign-in failed: ' + (error instanceof Error ? error.message : 'Unknown error');

      const params = new URLSearchParams({
        status: 'error',
        provider: 'discord',
        error: errorMessage,
      });
      res.redirect(`${this.frontendUrl}/oauth/callback?${params}`);
    }
  }
}
