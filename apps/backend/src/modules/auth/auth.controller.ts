import {
  GetUserProfileQuery,
  GetUserProfileUseCase,
  LoginUserCommand,
  LoginUserUseCase,
  RegisterUserCommand,
  RegisterUserUseCase,
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
  Request,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ACCESS_COOKIE_NAME, getAccessCookieOptions } from '../../common/auth';
import { AuthResponseDto, LoginUserDto, RegisterUserDto, UserProfileDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getUserProfileUseCase: GetUserProfileUseCase,
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
  async register(
    @Body() registerDto: RegisterUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'register',
    });

    try {
      operationLogger.info('User registration attempt', {
        metadata: {
          email: registerDto.email,
          username: registerDto.username,
        },
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
            errors: result.errors,
          },
        });
        throw new ConflictException(result.errors.join(', '));
      }

      operationLogger.info('User registration successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      });

      res.cookie(ACCESS_COOKIE_NAME, result.token!, getAccessCookieOptions());

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
          username: registerDto.username,
        },
      });

      if (error instanceof ConflictException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException('Registration failed: ' + message);
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
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const operationLogger = this.logger.child({
      component: 'AuthController',
      operation: 'login',
    });

    try {
      operationLogger.info('User login attempt', {
        metadata: {
          email: loginDto.email,
        },
      });

      const command = new LoginUserCommand(loginDto.email, loginDto.password);

      const result = await this.loginUserUseCase.execute(command);

      if (!result.success) {
        operationLogger.warn('User login failed - invalid credentials', {
          metadata: {
            email: loginDto.email,
            errors: result.errors,
          },
        });
        throw new UnauthorizedException(result.errors.join(', '));
      }

      operationLogger.info('User login successful', {
        metadata: {
          userId: result.user!.id.value,
          email: result.user!.email.value,
          username: result.user!.username.value,
        },
      });

      res.cookie(ACCESS_COOKIE_NAME, result.token!, getAccessCookieOptions());

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
          email: loginDto.email,
        },
      });

      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException('Login failed: ' + message);
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
      userId: req.user.userId,
    });

    try {
      operationLogger.debug('Retrieving user profile');

      const query = new GetUserProfileQuery(req.user.userId);
      const result = await this.getUserProfileUseCase.execute(query);

      if (!result.success) {
        operationLogger.warn('Failed to retrieve user profile', {
          metadata: { errors: result.errors },
        });
        throw new UnauthorizedException(result.errors.join(', '));
      }

      const user = result.user!;

      operationLogger.debug('User profile retrieved successfully', {
        metadata: {
          email: user.email.value,
          username: user.username.value,
        },
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new UnauthorizedException('Failed to get profile: ' + message);
    }
  }
}
