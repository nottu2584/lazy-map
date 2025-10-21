import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  GetUserProfileUseCase,
  GoogleSignInUseCase,
  LinkGoogleAccountUseCase,
  RegisterUserCommand,
  LoginUserCommand,
  GetUserProfileQuery,
  GoogleSignInCommand,
  LinkGoogleAccountCommand,
} from '@lazy-map/application';
import {
  RegisterUserDto,
  LoginUserDto,
  AuthResponseDto,
  UserProfileDto,
  GoogleSignInDto,
  LinkGoogleAccountDto
} from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ILogger } from '@lazy-map/domain';
import { LOGGER_TOKEN } from '@lazy-map/infrastructure';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
    private readonly googleSignInUseCase: GoogleSignInUseCase,
    private readonly linkGoogleAccountUseCase: LinkGoogleAccountUseCase,
    @Inject(LOGGER_TOKEN) private readonly logger: ILogger,
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
}