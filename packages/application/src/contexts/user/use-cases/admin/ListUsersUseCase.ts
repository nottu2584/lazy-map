import { IUserRepository, User, UserRole, UserStatus, UserId } from '@lazy-map/domain';

export class ListUsersQuery {
  constructor(
    public readonly adminId: string,
    public readonly limit: number = 20,
    public readonly offset: number = 0,
    public readonly role?: string,
    public readonly status?: string,
    public readonly searchTerm?: string
  ) {}
}

export interface ListUsersResult {
  success: boolean;
  data?: {
    users: {
      id: string;
      email: string;
      username: string;
      role: string;
      status: string;
      createdAt: Date;
      lastLoginAt: Date | null;
      suspendedAt: Date | null;
      suspensionReason: string | null;
    }[];
    total: number;
    hasMore: boolean;
  };
  error?: string;
}

/**
 * Use case for listing users with admin privileges
 */
export class ListUsersUseCase {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: ListUsersQuery): Promise<ListUsersResult> {
    try {
      // Verify admin has permission
      const adminUserId = UserId.fromString(query.adminId);
      const admin = await this.userRepository.findById(adminUserId);
      
      if (!admin || !admin.canManageUsers()) {
        return {
          success: false,
          error: 'Insufficient permissions to list users'
        };
      }

      // Parse filters
      const roleFilter = query.role ? UserRole.fromString(query.role) : undefined;
      const statusFilter = query.status ? UserStatus.fromString(query.status) : undefined;

      // Get paginated users
      const result = await this.userRepository.findPaginated({
        limit: query.limit,
        offset: query.offset,
        role: roleFilter,
        status: statusFilter,
        searchTerm: query.searchTerm
      });

      return {
        success: true,
        data: {
          users: result.users.map(user => ({
            id: user.id.value,
            email: user.email.value,
            username: user.username.value,
            role: user.role.toString(),
            status: user.status.toString(),
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            suspendedAt: user.suspendedAt,
            suspensionReason: user.suspensionReason
          })),
          total: result.total,
          hasMore: result.hasMore
        }
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to list users';
      return {
        success: false,
        error: errorMessage
      };
    }
  }
}