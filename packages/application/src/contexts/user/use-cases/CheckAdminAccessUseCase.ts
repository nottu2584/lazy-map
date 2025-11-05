import { IUserRepository, UserId, ILogger } from '@lazy-map/domain';
import { CheckAdminAccessCommand, AdminAccessResult } from '../commands';

/**
 * Use case for checking if a user has admin access
 * Returns detailed permission information for the user
 */
export class CheckAdminAccessUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger?: ILogger
  ) {}

  /**
   * Execute admin access check
   */
  async execute(command: CheckAdminAccessCommand): Promise<AdminAccessResult> {
    this.logger?.debug('Checking admin access', {
      metadata: { userId: command.userId }
    });

    try {
      // Validate user ID
      let userIdVO: UserId;
      try {
        userIdVO = UserId.fromString(command.userId);
      } catch (error) {
        this.logger?.warn('Invalid user ID format', {
          metadata: { userId: command.userId, error: error instanceof Error ? error.message : 'Unknown error' }
        });
        return new AdminAccessResult(false, undefined, undefined, undefined, 'Invalid user ID format');
      }

      // Find user in repository
      const user = await this.userRepository.findById(userIdVO);

      if (!user) {
        this.logger?.warn('User not found for admin access check', {
          metadata: { userId: command.userId }
        });
        return new AdminAccessResult(false, undefined, undefined, undefined, 'User not found');
      }

      // Check if user account is active
      if (!user.canUseSystem()) {
        this.logger?.info('User account is not active', {
          metadata: { userId: command.userId, status: user.status.toString() }
        });
        return new AdminAccessResult(
          false,
          user.id.value,
          user.role.toString(),
          undefined,
          'User account is not active'
        );
      }

      // Check if user has admin role
      const hasAccess = user.role.isAdmin();

      // Build permission details based on admin role
      const permissions = {
        canManageUsers: user.canManageUsers(),
        canManageMaps: hasAccess,
        canViewStats: hasAccess,
        canAccessAdminPanel: hasAccess
      };

      this.logger?.info('Admin access check completed', {
        metadata: {
          userId: command.userId,
          hasAccess,
          role: user.role.toString()
        }
      });

      return new AdminAccessResult(
        hasAccess,
        user.id.value,
        user.role.toString(),
        permissions
      );
    } catch (error) {
      this.logger?.error('Error checking admin access', {
        metadata: {
          userId: command.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return new AdminAccessResult(
        false,
        undefined,
        undefined,
        undefined,
        'Failed to check admin access'
      );
    }
  }
}