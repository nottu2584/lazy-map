import { IUserRepository, UserId } from '@lazy-map/domain';

export interface AdminAuthContext {
  userId: string;
}

export interface AdminGuardResult {
  isAuthorized: boolean;
  error?: string;
  adminUserId?: UserId;
}

export class AdminGuard {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async requireAdminAccess(context: AdminAuthContext): Promise<AdminGuardResult> {
    try {
      const adminUserId = UserId.fromString(context.userId);
      const admin = await this.userRepository.findById(adminUserId);

      if (!admin) {
        return {
          isAuthorized: false,
          error: 'User not found'
        };
      }

      if (!admin.canManageUsers()) {
        return {
          isAuthorized: false,
          error: 'Insufficient permissions - admin access required'
        };
      }

      return {
        isAuthorized: true,
        adminUserId: adminUserId
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authorization check failed';
      return {
        isAuthorized: false,
        error: errorMessage
      };
    }
  }

  async requireSuperAdminAccess(context: AdminAuthContext): Promise<AdminGuardResult> {
    try {
      const adminUserId = UserId.fromString(context.userId);
      const admin = await this.userRepository.findById(adminUserId);

      if (!admin) {
        return {
          isAuthorized: false,
          error: 'User not found'
        };
      }

      if (!admin.canPromoteUsers()) {
        return {
          isAuthorized: false,
          error: 'Insufficient permissions - super admin access required'
        };
      }

      return {
        isAuthorized: true,
        adminUserId: adminUserId
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authorization check failed';
      return {
        isAuthorized: false,
        error: errorMessage
      };
    }
  }

  async requireDeleteAccess(context: AdminAuthContext): Promise<AdminGuardResult> {
    try {
      const adminUserId = UserId.fromString(context.userId);
      const admin = await this.userRepository.findById(adminUserId);

      if (!admin) {
        return {
          isAuthorized: false,
          error: 'User not found'
        };
      }

      if (!admin.canDeleteUsers()) {
        return {
          isAuthorized: false,
          error: 'Insufficient permissions - delete access required'
        };
      }

      return {
        isAuthorized: true,
        adminUserId: adminUserId
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Authorization check failed';
      return {
        isAuthorized: false,
        error: errorMessage
      };
    }
  }
}