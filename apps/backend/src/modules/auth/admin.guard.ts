import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
  Inject
} from '@nestjs/common';
import { IUserRepository, UserId } from '@lazy-map/domain';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id || request.body?.adminId;

    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }

    try {
      const adminUserId = UserId.fromString(userId);
      const admin = await this.userRepository.findById(adminUserId);

      if (!admin) {
        throw new ForbiddenException('User not found');
      }

      if (!admin.canManageUsers()) {
        throw new ForbiddenException('Insufficient permissions - admin access required');
      }

      // Add admin info to request for later use
      request.admin = {
        id: admin.id.value,
        role: admin.role.toString(),
        canPromote: admin.canPromoteUsers(),
        canDelete: admin.canDeleteUsers()
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