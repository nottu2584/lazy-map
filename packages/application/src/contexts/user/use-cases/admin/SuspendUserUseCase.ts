import { IUserRepository, User, UserId } from '@lazy-map/domain';

export class SuspendUserCommand {
  constructor(
    public readonly adminId: string,
    public readonly userId: string,
    public readonly reason: string
  ) {}
}

export interface SuspendUserResult {
  success: boolean;
  data?: {
    id: string;
    status: string;
    suspendedAt: Date;
    suspensionReason: string;
  };
  error?: string;
}

export class SuspendUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: SuspendUserCommand): Promise<SuspendUserResult> {
    try {
      if (!command.reason || command.reason.trim().length === 0) {
        return {
          success: false,
          error: 'Suspension reason is required'
        };
      }

      const adminUserId = UserId.fromString(command.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canManageUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to suspend users'
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
          error: 'Cannot suspend yourself'
        };
      }

      if (targetUser.status.isSuspended()) {
        return {
          success: false,
          error: 'User is already suspended'
        };
      }

      if (targetUser.hasAdminPrivileges() && !admin.canPromoteUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to suspend admin users'
        };
      }

      targetUser.suspend(adminUserId, command.reason.trim());
      await this.userRepository.save(targetUser);

      return {
        success: true,
        data: {
          id: targetUser.id.value,
          status: targetUser.status.toString(),
          suspendedAt: targetUser.suspendedAt!,
          suspensionReason: targetUser.suspensionReason!
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to suspend user';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}