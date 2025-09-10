import { IUserRepository, User, UserId } from '@lazy-map/domain';

export class GetUserStatsQuery {
  constructor(
    public readonly adminId: string
  ) {}
}

export interface GetUserStatsResult {
  success: boolean;
  data?: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
    deactivatedUsers: number;
    adminUsers: number;
    superAdminUsers: number;
    regularUsers: number;
    generatedAt: Date;
  };
  error?: string;
}

export class GetUserStatsUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserStatsQuery): Promise<GetUserStatsResult> {
    try {
      const adminUserId = UserId.fromString(query.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canManageUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to view user statistics'
        };
      }

      const stats = await this.userRepository.getStats();

      return {
        success: true,
        data: {
          totalUsers: stats.totalUsers,
          activeUsers: stats.activeUsers,
          suspendedUsers: stats.suspendedUsers,
          pendingUsers: stats.pendingUsers,
          deactivatedUsers: stats.totalUsers - stats.activeUsers - stats.suspendedUsers - stats.pendingUsers,
          adminUsers: stats.adminUsers,
          superAdminUsers: 0,
          regularUsers: stats.totalUsers - stats.adminUsers,
          generatedAt: new Date()
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user statistics';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}