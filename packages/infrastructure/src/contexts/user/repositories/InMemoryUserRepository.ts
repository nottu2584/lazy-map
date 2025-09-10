import { IUserRepository, User, UserId, Email, Username } from '@lazy-map/domain';

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

  // Testing utilities
  clear(): void {
    this.users.clear();
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}