import { IUserRepository, User, UserId, UserRole } from '@lazy-map/domain';

export class PromoteUserCommand {
  constructor(
    public readonly adminId: string,
    public readonly userId: string,
    public readonly newRole: string,
    public readonly promotedAt: Date = new Date()
  ) {}
}

export interface PromoteUserResult {
  success: boolean;
  data?: {
    id: string;
    previousRole: string;
    newRole: string;
    promotedAt: Date;
  };
  error?: string;
}

export class PromoteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: PromoteUserCommand): Promise<PromoteUserResult> {
    try {
      const adminUserId = UserId.fromString(command.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canPromoteUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to promote users'
        };
      }

      const targetUserId = UserId.fromString(command.userId);
      const targetUser = await this.userRepository.findById(targetUserId);
      
      if (!targetUser) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (targetUser.id.equals(adminUserId)) {
        return {
          success: false,
          error: 'Cannot change your own role'
        };
      }

      if (!targetUser.canUseSystem()) {
        return {
          success: false,
          error: 'Cannot promote inactive users'
        };
      }

      const newRole = UserRole.fromString(command.newRole);
      const previousRole = targetUser.role.toString();

      if (targetUser.role.equals(newRole)) {
        return {
          success: false,
          error: `User already has role: ${newRole.toString()}`
        };
      }

      if (newRole.isSuperAdmin() && !admin.role.isSuperAdmin()) {
        return {
          success: false,
          error: 'Only super admins can promote users to super admin'
        };
      }

      targetUser.promote(newRole, command.promotedAt);
      await this.userRepository.save(targetUser);

      return {
        success: true,
        data: {
          id: targetUser.id.value,
          previousRole: previousRole,
          newRole: targetUser.role.toString(),
          promotedAt: targetUser.updatedAt
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to promote user';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}