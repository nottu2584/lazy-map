/**
 * User permissions detail
 */
export class UserPermissions {
  constructor(
    public readonly userId: string,
    public readonly role: string,
    public readonly isAdmin: boolean,
    public readonly permissions: {
      // User management
      canManageUsers: boolean;
      canPromoteUsers: boolean;
      canSuspendUsers: boolean;
      canDeleteUsers: boolean;
      canViewUserDetails: boolean;

      // Map management
      canManageMaps: boolean;
      canDeleteMaps: boolean;
      canViewAllMaps: boolean;

      // System management
      canViewStats: boolean;
      canAccessAdminPanel: boolean;
      canManageSystem: boolean;

      // Feature management
      canManageFeatures: boolean;
      canToggleFeatures: boolean;
    }
  ) {}
}