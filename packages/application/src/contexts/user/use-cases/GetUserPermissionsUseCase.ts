import { IUserRepository, UserId, ILogger } from '@lazy-map/domain';
import { GetUserPermissionsQuery, UserPermissions } from '../commands';

/**
 * Use case for retrieving detailed user permissions
 * Provides granular permission information for UI/authorization
 */
export class GetUserPermissionsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly logger?: ILogger
  ) {}

  /**
   * Execute permission retrieval
   */
  async execute(query: GetUserPermissionsQuery): Promise<UserPermissions | null> {
    this.logger?.debug('Getting user permissions', {
      metadata: { userId: query.userId }
    });

    try {
      // Parse user ID
      const userIdVO = UserId.fromString(query.userId);

      // Find user
      const user = await this.userRepository.findById(userIdVO);

      if (!user) {
        this.logger?.warn('User not found for permissions query', {
          metadata: { userId: query.userId }
        });
        return null;
      }

      // Build detailed permissions based on role and status
      const isAdmin = user.role.isAdmin();
      const isActive = user.canUseSystem();

      const permissions = {
        // User management - admins only
        canManageUsers: isAdmin && isActive,
        canPromoteUsers: isAdmin && isActive,
        canSuspendUsers: isAdmin && isActive,
        canDeleteUsers: isAdmin && isActive,
        canViewUserDetails: isAdmin && isActive,

        // Map management - admins can manage all maps
        canManageMaps: isAdmin && isActive,
        canDeleteMaps: isAdmin && isActive,
        canViewAllMaps: isAdmin && isActive,

        // System management - admins only
        canViewStats: isAdmin && isActive,
        canAccessAdminPanel: isAdmin && isActive,
        canManageSystem: isAdmin && isActive,

        // Feature management - admins only
        canManageFeatures: isAdmin && isActive,
        canToggleFeatures: isAdmin && isActive
      };

      this.logger?.info('User permissions retrieved', {
        metadata: {
          userId: query.userId,
          role: user.role.toString(),
          isAdmin
        }
      });

      return new UserPermissions(
        user.id.value,
        user.role.toString(),
        isAdmin,
        permissions
      );
    } catch (error) {
      this.logger?.error('Error getting user permissions', {
        metadata: {
          userId: query.userId,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      return null;
    }
  }
}