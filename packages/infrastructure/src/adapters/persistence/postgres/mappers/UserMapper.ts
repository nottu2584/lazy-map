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
      Password.fromHash(entity.passwordHash),
      Username.fromString(entity.username),
      UserRole.fromString(entity.role),
      UserStatus.fromString(entity.status),
      entity.createdAt,
      entity.updatedAt,
      entity.lastMapGeneratedAt || null
    );
  }

  /**
   * Convert domain entity to database entity
   */
  static toPersistence(user: User): UserEntity {
    return new UserEntity({
      id: user.id.value,
      email: user.email.value,
      passwordHash: user.password.value,
      username: user.username.value,
      role: user.role.value,
      status: user.status.value,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastMapGeneratedAt: user.lastLoginAt,
      // Default values for fields not in domain model
      preferences: {},
      subscriptionTier: 'free',
      mapGenerationLimit: 10,
      mapsGeneratedThisMonth: 0
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