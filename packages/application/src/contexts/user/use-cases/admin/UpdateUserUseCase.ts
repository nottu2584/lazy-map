import { IUserRepository, UserId, Email, Username } from '@lazy-map/domain';

export class UpdateUserCommand {
  constructor(
    public readonly adminId: string,
    public readonly userId: string,
    public readonly email?: string,
    public readonly username?: string,
    public readonly updatedAt: Date = new Date()
  ) {}
}

export interface UpdateUserResult {
  success: boolean;
  data?: {
    id: string;
    email: string;
    username: string;
    role: string;
    status: string;
    updatedAt: Date;
  };
  error?: string;
}

export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(command: UpdateUserCommand): Promise<UpdateUserResult> {
    try {
      const adminUserId = UserId.fromString(command.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canManageUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to update users'
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

      if (command.email) {
        const newEmail = Email.fromString(command.email);
        
        const existingUser = await this.userRepository.findByEmail(newEmail);
        if (existingUser && !existingUser.id.equals(targetUserId)) {
          return {
            success: false,
            error: 'Email already in use by another user'
          };
        }
        
        targetUser.changeEmail(newEmail, command.updatedAt);
      }

      if (command.username) {
        const newUsername = Username.fromString(command.username);
        
        const existingUser = await this.userRepository.findByUsername(newUsername);
        if (existingUser && !existingUser.id.equals(targetUserId)) {
          return {
            success: false,
            error: 'Username already in use by another user'
          };
        }
        
        targetUser.changeUsername(newUsername, command.updatedAt);
      }

      await this.userRepository.save(targetUser);

      return {
        success: true,
        data: {
          id: targetUser.id.value,
          email: targetUser.email.value,
          username: targetUser.username.value,
          role: targetUser.role.toString(),
          status: targetUser.status.toString(),
          updatedAt: targetUser.updatedAt
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}