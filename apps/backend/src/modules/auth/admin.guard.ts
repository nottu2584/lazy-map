import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject
} from '@nestjs/common';
import { IUserRepository, UserId } from '@lazy-map/domain';

/**
 * Guard that checks if user has admin privileges
 * Simplified version that only checks for ADMIN role
 *
 * @deprecated Use @RequireAdmin() decorator with RolesGuard or AuthRolesGuard instead
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id || request.body?.adminId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      const adminUserId = UserId.fromString(userId);
      const admin = await this.userRepository.findById(adminUserId);

      if (!admin) {
        throw new ForbiddenException('User not found');
      }

      // Check if user is active
      if (!admin.canUseSystem()) {
        throw new ForbiddenException('User account is suspended or inactive');
      }

      // Check if user has admin role
      if (!admin.role.isAdmin()) {
        throw new ForbiddenException('Insufficient permissions - admin access required');
      }

      // Add admin info to request for later use
      request.admin = {
        id: admin.id.value,
        role: admin.role.toString(),
        canManageUsers: admin.canManageUsers(),
        canManageSystem: admin.role.isAdmin()
      };

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new ForbiddenException('Authorization check failed');
    }
  }
}