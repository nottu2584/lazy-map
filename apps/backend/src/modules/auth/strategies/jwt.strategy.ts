import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { ACCESS_COOKIE_NAME } from '../../../common/auth';

export interface JwtPayload {
  sub: string; // User ID
  email: string;
  username: string;
  role?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret =
      configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production';
    super({
      jwtFromRequest: (req: Request) => {
        // 1. Try httpOnly cookie first (browser clients)
        const cookieToken = req?.cookies?.[ACCESS_COOKIE_NAME];
        if (cookieToken) {
          return cookieToken;
        }
        // 2. Fall back to Authorization header (API clients)
        return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      },
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: JwtPayload) {
    // The JWT has already been verified at this point
    // We can do additional validation here if needed
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role || 'USER',
    };

    // Return the user object that will be attached to the request
    return user;
  }
}
