import * as jwt from 'jsonwebtoken';
import { IAuthenticationPort } from '@lazy-map/application';

interface JwtPayload {
  sub: string; // user ID
  email: string;
  iat: number;
  exp: number;
}

/**
 * JWT implementation of authentication service
 */
export class JwtAuthenticationService implements IAuthenticationPort {
  private readonly secret: string;
  private readonly expiresIn: string = '7d'; // 7 days
  private readonly algorithm = 'HS256';

  constructor(secret?: string) {
    this.secret = secret || process.env.JWT_SECRET || 'your-secret-key';
    
    if (this.secret === 'your-secret-key') {
      console.warn('Using default JWT secret. This should only be used in development!');
    }
  }

  async generateToken(userId: string, email: string): Promise<string> {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: userId,
      email
    };

    return new Promise((resolve, reject) => {
      jwt.sign(
        payload,
        this.secret,
        {
          algorithm: this.algorithm as jwt.Algorithm,
          expiresIn: this.expiresIn
        } as jwt.SignOptions,
        (error, token) => {
          if (error || !token) {
            reject(error || new Error('Failed to generate token'));
          } else {
            resolve(token);
          }
        }
      );
    });
  }

  async verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
    return new Promise((resolve) => {
      jwt.verify(
        token,
        this.secret,
        { algorithms: [this.algorithm as jwt.Algorithm] },
        (error, decoded) => {
          if (error || !decoded || typeof decoded === 'string') {
            resolve(null);
            return;
          }

          const payload = decoded as JwtPayload;
          
          // Validate payload structure
          if (!payload.sub || !payload.email) {
            resolve(null);
            return;
          }

          resolve({
            userId: payload.sub,
            email: payload.email
          });
        }
      );
    });
  }

  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      
      if (!decoded || !decoded.exp) {
        return true;
      }

      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  getTokenTTL(): number {
    // Return TTL in seconds
    return 7 * 24 * 60 * 60; // 7 days
  }

  /**
   * Extract user ID from token without full verification (for testing)
   */
  decodeToken(token: string): { userId: string; email: string } | null {
    try {
      const decoded = jwt.decode(token) as JwtPayload | null;
      
      if (!decoded || !decoded.sub || !decoded.email) {
        return null;
      }

      return {
        userId: decoded.sub,
        email: decoded.email
      };
    } catch (error) {
      return null;
    }
  }
}