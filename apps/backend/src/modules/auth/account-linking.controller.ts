import {
  LinkDiscordAccountCommand,
  LinkDiscordAccountUseCase,
  LinkGoogleAccountCommand,
  LinkGoogleAccountUseCase,
} from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';
import {
  BadRequestException,
  Body,
  Controller,
  HttpStatus,
  Inject,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LinkDiscordAccountDto, LinkGoogleAccountDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('account-linking')
@Controller('auth')
export class AccountLinkingController {
  constructor(
    private readonly linkGoogleAccountUseCase: LinkGoogleAccountUseCase,
    private readonly linkDiscordAccountUseCase: LinkDiscordAccountUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
  ) {}

  @Post('link-google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Google account to existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google account linked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to link Google account',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async linkGoogleAccount(
    @Request() req: any,
    @Body() linkGoogleDto: LinkGoogleAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    const operationLogger = this.logger.child({
      component: 'AccountLinkingController',
      operation: 'linkGoogleAccount',
      userId: req.user.userId,
    });

    try {
      operationLogger.info('Attempting to link Google account');

      const command = new LinkGoogleAccountCommand(req.user.userId, linkGoogleDto.idToken);

      const result = await this.linkGoogleAccountUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to link Google account', {
          metadata: { errors: result.errors },
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Google account linked successfully');

      return {
        success: true,
        message: 'Google account linked successfully',
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to link Google account: ' + message);
    }
  }

  @Post('link-discord')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Discord account to existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Discord account linked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to link Discord account',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async linkDiscordAccount(
    @Request() req: any,
    @Body() linkDiscordDto: LinkDiscordAccountDto,
  ): Promise<{ success: boolean; message: string }> {
    const operationLogger = this.logger.child({
      component: 'AccountLinkingController',
      operation: 'linkDiscordAccount',
      userId: req.user.userId,
    });

    try {
      operationLogger.info('Attempting to link Discord account');

      const command = new LinkDiscordAccountCommand(req.user.userId, linkDiscordDto.accessToken);

      const result = await this.linkDiscordAccountUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to link Discord account', {
          metadata: { errors: result.errors },
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Discord account linked successfully');

      return {
        success: true,
        message: 'Discord account linked successfully',
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Failed to link Discord account: ' + message);
    }
  }
}
