import { IUserRepository, User, UserId } from '@lazy-map/domain';

export class ReactivateUserCommand {
  constructor(
    public readonly adminId: string,
    public readonly userId: string,
    public readonly reactivatedAt: Date = new Date()
  ) {}
}

export interface ReactivateUserResult {
  success: boolean;
  data?: {
    id: string;
    status: string;
    reactivatedAt: Date;
  };
  error?: string;
}

export class ReactivateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: ReactivateUserCommand): Promise<ReactivateUserResult> {
    try {
      const adminUserId = UserId.fromString(command.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canManageUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to reactivate users'
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

      if (!targetUser.status.isSuspended()) {
        return {
          success: false,
          error: 'User is not suspended'
        };
      }

      if (targetUser.hasAdminPrivileges() && !admin.canPromoteUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to reactivate admin users'
        };
      }

      targetUser.reactivate(command.reactivatedAt);
      await this.userRepository.save(targetUser);

      return {
        success: true,
        data: {
          id: targetUser.id.value,
          status: targetUser.status.toString(),
          reactivatedAt: targetUser.updatedAt
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate user';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}