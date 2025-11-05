/**
 * Result of admin access check
 */
export class AdminAccessResult {
  constructor(
    public readonly hasAccess: boolean,
    public readonly userId?: string,
    public readonly role?: string,
    public readonly permissions?: {
      canManageUsers: boolean;
      canManageMaps: boolean;
      canViewStats: boolean;
      canAccessAdminPanel: boolean;
    },
    public readonly error?: string
  ) {}
}