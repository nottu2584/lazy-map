import { IUserRepository, User, UserId, Email, Username, UserRole, UserStatus, GoogleId, DiscordId } from '@lazy-map/domain';

/**
 * In-memory implementation of user repository (for testing and development)
 */
export class InMemoryUserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id.value, user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.value) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async findByUsername(username: Username): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.username.equals(username)) {
        return user;
      }
    }
    return null;
  }

  async findByGoogleId(googleId: GoogleId): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.googleId === googleId.getValue()) {
        return user;
      }
    }
    return null;
  }

  async findByDiscordId(discordId: DiscordId): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.discordId === discordId.getValue()) {
        return user;
      }
    }
    return null;
  }

  async emailExists(email: Email): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async usernameExists(username: Username): Promise<boolean> {
    const user = await this.findByUsername(username);
    return user !== null;
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.value);
  }

  async count(): Promise<number> {
    return this.users.size;
  }

  async findAll(options?: {
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  }): Promise<User[]> {
    let users = Array.from(this.users.values());

    // Filter by role
    if (options?.role) {
      users = users.filter(user => user.role.equals(options.role!));
    }

    // Filter by status
    if (options?.status) {
      users = users.filter(user => user.status.equals(options.status!));
    }

    // Filter by search term (email or username)
    if (options?.searchTerm) {
      const searchLower = options.searchTerm.toLowerCase();
      users = users.filter(user =>
        user.email.value.toLowerCase().includes(searchLower) ||
        user.username.value.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    if (options?.offset !== undefined) {
      users = users.slice(options.offset);
    }
    if (options?.limit !== undefined) {
      users = users.slice(0, options.limit);
    }

    return users;
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role.equals(role));
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.status.equals(status));
  }

  async findPaginated(options: {
    limit: number;
    offset: number;
    role?: UserRole;
    status?: UserStatus;
    searchTerm?: string;
  }): Promise<{
    users: User[];
    total: number;
    hasMore: boolean;
  }> {
    // Get filtered users without pagination for total count
    const allFiltered = await this.findAll({
      role: options.role,
      status: options.status,
      searchTerm: options.searchTerm
    });

    const total = allFiltered.length;

    // Get paginated results
    const users = await this.findAll({
      ...options,
      limit: options.limit,
      offset: options.offset
    });

    const hasMore = options.offset + options.limit < total;

    return {
      users,
      total,
      hasMore
    };
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
    adminUsers: number;
  }> {
    const allUsers = Array.from(this.users.values());

    return {
      totalUsers: allUsers.length,
      activeUsers: allUsers.filter(user => user.status.isActive()).length,
      suspendedUsers: allUsers.filter(user => user.status.isSuspended()).length,
      pendingUsers: allUsers.filter(user => user.status.isPending()).length,
      adminUsers: allUsers.filter(user => user.role.isAdmin()).length
    };
  }

  // Testing utilities
  clear(): void {
    this.users.clear();
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}