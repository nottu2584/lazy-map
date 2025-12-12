import {
  GetUserProfileQuery,
  GetUserProfileUseCase,
  GoogleSignInCommand,
  GoogleSignInUseCase,
  DiscordSignInCommand,
  DiscordSignInUseCase,
  LinkGoogleAccountCommand,
  LinkGoogleAccountUseCase,
  LinkDiscordAccountCommand,
  LinkDiscordAccountUseCase,
  InitiateGoogleSignInCommand,
  InitiateGoogleSignInUseCase,
  CompleteGoogleSignInCommand,
  CompleteGoogleSignInUseCase,
  InitiateDiscordSignInCommand,
  InitiateDiscordSignInUseCase,
  CompleteDiscordSignInCommand,
  CompleteDiscordSignInUseCase,
  LoginUserCommand,
  LoginUserUseCase,
  RegisterUserCommand,
  RegisterUserUseCase,
  ITemplatePort,
} from '@lazy-map/application';
import { ILogger } from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
  Query,
  Res,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  GoogleSignInDto,
  DiscordSignInDto,
  LinkGoogleAccountDto,
  LinkDiscordAccountDto,
  LoginUserDto,
  RegisterUserDto,
  UserProfileDto
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly googleSignInUseCase: GoogleSignInUseCase,
    private readonly discordSignInUseCase: DiscordSignInUseCase,
    private readonly linkGoogleAccountUseCase: LinkGoogleAccountUseCase,
    private readonly linkDiscordAccountUseCase: LinkDiscordAccountUseCase,
    private readonly initiateGoogleSignInUseCase: InitiateGoogleSignInUseCase,
    private readonly completeGoogleSignInUseCase: CompleteGoogleSignInUseCase,
    private readonly initiateDiscordSignInUseCase: InitiateDiscordSignInUseCase,
    private readonly completeDiscordSignInUseCase: CompleteDiscordSignInUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
    @Inject('ITemplatePort') private readonly templateService: ITemplatePort,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or username already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid registration data',
  })
  async register(@Body() registerDto: RegisterUserDto): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'register'
    });

    try {
      operationLogger.info('User registration attempt', {
        metadata: {
          email: registerDto.email,
          username: registerDto.username
        }
      });

      const command = new RegisterUserCommand(
        registerDto.email,
        registerDto.password,
        registerDto.username,
      );

      const result = await this.registerUserUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('User registration failed - validation errors', {
          metadata: {
            email: registerDto.email,
            username: registerDto.username,
            errors: result.errors
          }
        });
        throw new ConflictException(result.errors.join(', '));
      }

      operationLogger.info('User registration successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      return {
        accessToken: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      };
    } catch (error) {
      operationLogger.logError(error, {
        metadata: {
          email: registerDto.email,
          username: registerDto.username
        }
      });

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Registration failed: ' + error.message);
    }
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User successfully logged in',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
  })
  async login(@Body() loginDto: LoginUserDto): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'login'
    });

    try {
      operationLogger.info('User login attempt', {
        metadata: {
          email: loginDto.email
        }
      });

      const command = new LoginUserCommand(
        loginDto.email,
        loginDto.password,
      );

      const result = await this.loginUserUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('User login failed - invalid credentials', {
          metadata: {
            email: loginDto.email,
            errors: result.errors
          }
        });
        throw new UnauthorizedException(result.errors.join(', '));
      }

      operationLogger.info('User login successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      return {
        accessToken: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      };
    } catch (error) {
      operationLogger.logError(error, {
        metadata: {
          email: loginDto.email
        }
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed: ' + error.message);
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  async getProfile(@Request() req: any): Promise<UserProfileDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'getProfile',
      userId: req.user.userId
    });

    try {
      operationLogger.debug('Retrieving user profile');

      const query = new GetUserProfileQuery(req.user.userId);
      const result = await this.getUserProfileUseCase.execute(query);

      if (!result.success) {
        operationLogger.warn('Failed to retrieve user profile', {
          metadata: { errors: result.errors }
        });
        throw new UnauthorizedException(result.errors.join(', '));
      }

      const user = result.user!;
      
      operationLogger.debug('User profile retrieved successfully', {
        metadata: {
          email: user.email.value,
          username: user.username.value
        }
      });

      return {
        id: user.id.value,
        email: user.email.value,
        username: user.username.value,
        createdAt: user.createdAt,
        lastLogin: user.lastLoginAt || undefined,
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to get profile: ' + error.message);
    }
  }

  @Post('google')
  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully authenticated with Google',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Google token',
  })
  async googleSignIn(@Body() googleSignInDto: GoogleSignInDto): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'googleSignIn'
    });

    try {
      operationLogger.info('Google sign-in attempt');

      const command = new GoogleSignInCommand(
        googleSignInDto.idToken,
        googleSignInDto.clientId
      );

      const result = await this.googleSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Google sign-in failed', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Google sign-in successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      return {
        accessToken: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Google sign-in failed: ' + error.message);
    }
  }

  @Post('link-google')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Google account to existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google account linked successfully',
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
    @Body() linkGoogleDto: LinkGoogleAccountDto
  ): Promise<{ success: boolean; message: string }> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'linkGoogleAccount',
      userId: req.user.userId
    });

    try {
      operationLogger.info('Attempting to link Google account');

      const command = new LinkGoogleAccountCommand(
        req.user.userId,
        linkGoogleDto.idToken
      );

      const result = await this.linkGoogleAccountUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to link Google account', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Google account linked successfully');

      return {
        success: true,
        message: 'Google account linked successfully'
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to link Google account: ' + error.message);
    }
  }

  @Post('discord')
  @ApiOperation({ summary: 'Sign in with Discord' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully authenticated with Discord',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid Discord token',
  })
  async discordSignIn(@Body() discordSignInDto: DiscordSignInDto): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'discordSignIn'
    });

    try {
      operationLogger.info('Discord sign-in attempt');

      const command = new DiscordSignInCommand(
        discordSignInDto.accessToken
      );

      const result = await this.discordSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Discord sign-in failed', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Discord sign-in successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      return {
        accessToken: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Discord sign-in failed: ' + error.message);
    }
  }

  @Post('link-discord')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link Discord account to existing user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Discord account linked successfully',
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
    @Body() linkDiscordDto: LinkDiscordAccountDto
  ): Promise<{ success: boolean; message: string }> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'linkDiscordAccount',
      userId: req.user.userId
    });

    try {
      operationLogger.info('Attempting to link Discord account');

      const command = new LinkDiscordAccountCommand(
        req.user.userId,
        linkDiscordDto.accessToken
      );

      const result = await this.linkDiscordAccountUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to link Discord account', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Discord account linked successfully');

      return {
        success: true,
        message: 'Discord account linked successfully'
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to link Discord account: ' + error.message);
    }
  }

  @Get('google/login')
  @ApiOperation({ summary: 'Initiate Google OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to generate authorization URL',
  })
  async initiateGoogleSignIn(
    @Query('redirectUri') redirectUri: string,
    @Query('state') state?: string
  ): Promise<{ authorizationUrl: string }> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'initiateGoogleSignIn'
    });

    try {
      if (!redirectUri) {
        throw new BadRequestException('redirectUri query parameter is required');
      }

      operationLogger.info('Initiating Google OAuth sign-in', {
        metadata: { redirectUri, hasState: !!state }
      });

      const command = new InitiateGoogleSignInCommand(redirectUri, state);
      const result = await this.initiateGoogleSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to initiate Google sign-in', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Google authorization URL generated successfully');

      return {
        authorizationUrl: result.authorizationUrl!
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to initiate Google sign-in: ' + error.message);
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
    @Query('redirectUri') redirectUri: string,
    @Query('state') state: string | undefined,
    @Res() res: Response
  ): Promise<void> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'completeGoogleSignIn'
    });

    try {
      if (!code || !redirectUri) {
        throw new BadRequestException('code and redirectUri query parameters are required');
      }

      operationLogger.info('Completing Google OAuth sign-in', {
        metadata: { redirectUri, hasState: !!state }
      });

      const command = new CompleteGoogleSignInCommand(code, redirectUri, state);
      const result = await this.completeGoogleSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Google OAuth sign-in failed', {
          metadata: { errors: result.errors }
        });

        const errorHtml = this.templateService.renderOAuthError({
          provider: 'google',
          errorMessage: result.errors.join(', ')
        });

        res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
        return;
      }

      operationLogger.info('Google OAuth sign-in completed successfully', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value
        }
      });

      const successHtml = this.templateService.renderOAuthSuccess({
        provider: 'google',
        token: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      res.status(HttpStatus.OK).send(successHtml);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage = error instanceof BadRequestException
        ? error.message
        : 'OAuth sign-in failed: ' + error.message;

      const errorHtml = this.templateService.renderOAuthError({
        provider: 'google',
        errorMessage
      });

      res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
    }
  }

  @Get('discord/login')
  @ApiOperation({ summary: 'Initiate Discord OAuth sign-in' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authorization URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        authorizationUrl: { type: 'string' }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to generate authorization URL',
  })
  async initiateDiscordSignIn(
    @Query('redirectUri') redirectUri: string,
    @Query('state') state?: string
  ): Promise<{ authorizationUrl: string }> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'initiateDiscordSignIn'
    });

    try {
      if (!redirectUri) {
        throw new BadRequestException('redirectUri query parameter is required');
      }

      operationLogger.info('Initiating Discord OAuth sign-in', {
        metadata: { redirectUri, hasState: !!state }
      });

      const command = new InitiateDiscordSignInCommand(redirectUri, state);
      const result = await this.initiateDiscordSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Failed to initiate Discord sign-in', {
          metadata: { errors: result.errors }
        });
        throw new BadRequestException(result.errors.join(', '));
      }

      operationLogger.info('Discord authorization URL generated successfully');

      return {
        authorizationUrl: result.authorizationUrl!
      };
    } catch (error) {
      operationLogger.logError(error);

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to initiate Discord sign-in: ' + error.message);
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
    @Query('redirectUri') redirectUri: string,
    @Query('state') state: string | undefined,
    @Res() res: Response
  ): Promise<void> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'completeDiscordSignIn'
    });

    try {
      if (!code || !redirectUri) {
        throw new BadRequestException('code and redirectUri query parameters are required');
      }

      operationLogger.info('Completing Discord OAuth sign-in', {
        metadata: { redirectUri, hasState: !!state }
      });

      const command = new CompleteDiscordSignInCommand(code, redirectUri, state);
      const result = await this.completeDiscordSignInUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('Discord OAuth sign-in failed', {
          metadata: { errors: result.errors }
        });

        const errorHtml = this.templateService.renderOAuthError({
          provider: 'discord',
          errorMessage: result.errors.join(', ')
        });

        res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
        return;
      }

      operationLogger.info('Discord OAuth sign-in completed successfully', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value
        }
      });

      const successHtml = this.templateService.renderOAuthSuccess({
        provider: 'discord',
        token: result.token!,
        user: {
          id: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value
        }
      });

      res.status(HttpStatus.OK).send(successHtml);
    } catch (error) {
      operationLogger.logError(error);

      const errorMessage = error instanceof BadRequestException
        ? error.message
        : 'OAuth sign-in failed: ' + error.message;

      const errorHtml = this.templateService.renderOAuthError({
        provider: 'discord',
        errorMessage
      });

      res.status(HttpStatus.BAD_REQUEST).send(errorHtml);
    }
  }
}