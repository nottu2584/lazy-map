import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * JWT payload structure with role included
 */
export interface JwtPayload {
  sub: string;      // User ID
  email: string;
  role: string;     // User role (USER or ADMIN)
  iat: number;      // Issued at
  exp: number;      // Expiration
}

/**
 * Validated user object attached to request
 */
export interface JwtUser {
  userId: string;
  email: string;
  role: string;
}

/**
 * JWT authentication strategy
 * Validates JWT tokens and extracts user information including role
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
    });
  }

  /**
   * Validate JWT payload and return user object
   * This is called automatically by Passport after token verification
   */
  async validate(payload: JwtPayload): Promise<JwtUser> {
    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Return user object that will be attached to request
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role || 'USER', // Default to USER if role not in token (backwards compatibility)
    };
  }
}