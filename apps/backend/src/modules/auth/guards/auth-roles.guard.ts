import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Inject
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IUserRepository, UserId } from '@lazy-map/domain';

/**
 * Combined authentication and authorization guard
 * Checks both JWT authentication and role-based access in one guard
 * Fetches fresh user data from database to ensure up-to-date role information
 */
@Injectable()
export class AuthRolesGuard extends JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {
    super();
  }

  /**
   * Check authentication and authorization
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First check JWT authentication (parent class)
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]
    );

    // If no roles required, authentication is enough
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JWT strategy)
    const request = context.switchToHttp().getRequest();
    const jwtUser = request.user;

    if (!jwtUser || !jwtUser.userId) {
      throw new UnauthorizedException('User information not found in token');
    }

    try {
      // Fetch fresh user data from database
      const userId = UserId.fromString(jwtUser.userId);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Check if user account is active
      if (!user.canUseSystem()) {
        throw new ForbiddenException('User account is suspended or inactive');
      }

      // Check role
      const userRole = user.role.toString();
      const hasRequiredRole = requiredRoles.includes(userRole);

      if (!hasRequiredRole) {
        throw new ForbiddenException(
          `Insufficient permissions. Required: ${requiredRoles.join(' or ')}, Current: ${userRole}`
        );
      }

      // Update request with fresh user data
      request.user = {
        ...jwtUser,
        role: userRole,
        isActive: user.canUseSystem(),
        canManageUsers: user.canManageUsers(),
        canManageSystem: user.role.isAdmin()
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException('Authorization check failed');
    }
  }
}