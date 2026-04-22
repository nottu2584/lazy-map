import {
  CompleteDiscordSignInCommand,
  CompleteDiscordSignInUseCase,
  CompleteGoogleSignInCommand,
  CompleteGoogleSignInUseCase,
  InitiateDiscordSignInCommand,
  InitiateDiscordSignInUseCase,
  InitiateGoogleSignInCommand,
  InitiateGoogleSignInUseCase,
  ITemplatePort,
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
  constructor(
    private readonly initiateGoogleSignInUseCase: InitiateGoogleSignInUseCase,
    private readonly completeGoogleSignInUseCase: CompleteGoogleSignInUseCase,
    private readonly initiateDiscordSignInUseCase: InitiateDiscordSignInUseCase,
    private readonly completeDiscordSignInUseCase: CompleteDiscordSignInUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    @Inject('ITemplatePort') private readonly templateService: ITemplatePort,
  ) {}

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

        const errorHtml = this.templateService.renderOAuthError({
          provider: 'google',
          errorMessage: result.errors.join(', '),
        });

        res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
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

      const successHtml = this.templateService.renderOAuthSuccess({
        provider: 'google',
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      });

      res.status(HttpStatus.OK).send(successHtml);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage =
        error instanceof BadRequestException
          ? error.message
          : 'OAuth sign-in failed: ' + (error instanceof Error ? error.message : 'Unknown error');

      const errorHtml = this.templateService.renderOAuthError({
        provider: 'google',
        errorMessage,
      });

      res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
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

        const errorHtml = this.templateService.renderOAuthError({
          provider: 'discord',
          errorMessage: result.errors.join(', '),
        });

        res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
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

      const successHtml = this.templateService.renderOAuthSuccess({
        provider: 'discord',
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      });

      res.status(HttpStatus.OK).send(successHtml);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage =
        error instanceof BadRequestException
          ? error.message
          : 'OAuth sign-in failed: ' + (error instanceof Error ? error.message : 'Unknown error');

      const errorHtml = this.templateService.renderOAuthError({
        provider: 'discord',
        errorMessage,
      });

      res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
    }
  }
}
