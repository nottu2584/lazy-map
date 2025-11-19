import {
  User,
  UserId,
  Email,
  Password,
  Username,
  UserRole,
  UserStatus
} from '@lazy-map/domain';
import { UserEntity } from '../entities/UserEntity';

/**
 * Mapper for converting between User domain entity and UserEntity database entity
 */
export class UserMapper {
  /**
   * Convert database entity to domain entity
   */
  static toDomain(entity: UserEntity): User {
    return User.fromPersistence(
      new UserId(entity.id),
      Email.fromString(entity.email),
      entity.passwordHash ? Password.fromHash(entity.passwordHash) : null,
      Username.fromString(entity.username),
      UserRole.fromString(entity.role),
      UserStatus.fromString(entity.status),
      entity.createdAt,
      entity.updatedAt,
      entity.lastLoginAt || null,
      entity.suspendedAt || null,
      entity.suspendedBy ? new UserId(entity.suspendedBy) : null,
      entity.suspensionReason || null,
      entity.authProvider || 'local',
      entity.googleId || undefined,
      entity.discordId || undefined,
      entity.profilePicture || undefined,
      entity.emailVerified || false
    );
  }

  /**
   * Convert domain entity to database entity
   */
  static toPersistence(user: User): UserEntity {
    return new UserEntity({
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.password ? user.password.value : null,
      username: user.username.value,
      role: user.role.value,
      status: user.status.value,
      authProvider: user.authProvider,
      googleId: user.googleId || null,
      discordId: user.discordId || null,
      profilePicture: user.profilePicture || null,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
      suspendedAt: user.suspendedAt,
      suspendedBy: user.suspendedBy ? user.suspendedBy.value : null,
      suspensionReason: user.suspensionReason,
      // Default values for fields not in domain model
      preferences: {},
      subscriptionTier: 'free',
      mapGenerationLimit: 10,
      mapsGeneratedThisMonth: 0,
      lastMapGeneratedAt: null
    });
  }

  /**
   * Convert array of database entities to domain entities
   */
  static toDomainArray(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convert array of domain entities to database entities
   */
  static toPersistenceArray(users: User[]): UserEntity[] {
    return users.map(user => this.toPersistence(user));
  }
}