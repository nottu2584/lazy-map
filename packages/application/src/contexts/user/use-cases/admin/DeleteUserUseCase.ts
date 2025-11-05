import { IUserRepository, User, UserId } from '@lazy-map/domain';

export class DeleteUserCommand {
  constructor(
    public readonly adminId: string,
    public readonly userId: string,
    public readonly confirmDeletion: boolean = false
  ) {}
}

export interface DeleteUserResult {
  success: boolean;
  data?: {
    id: string;
    email: string;
    username: string;
    deletedAt: Date;
  };
  error?: string;
}

export class DeleteUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: DeleteUserCommand): Promise<DeleteUserResult> {
    try {
      if (!command.confirmDeletion) {
        return {
          success: false,
          error: 'Deletion must be explicitly confirmed'
        };
      }

      const adminUserId = UserId.fromString(command.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canDeleteUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to delete users'
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
          error: 'Cannot delete yourself'
        };
      }

      if (targetUser.hasAdminPrivileges() && !admin.canPromoteUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to delete admin users'
        };
      }


      const deletedUserData = {
        id: targetUser.id.value,
        email: targetUser.email.value,
        username: targetUser.username.value,
        deletedAt: new Date()
      };

      await this.userRepository.delete(targetUserId);

      return {
        success: true,
        data: deletedUserData
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}