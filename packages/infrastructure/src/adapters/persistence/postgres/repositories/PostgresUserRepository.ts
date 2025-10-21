import { Repository, Like, ILike } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IUserRepository,
  User,
  UserId,
  Email,
  Username,
  UserRole,
  UserStatus,
  GoogleId
} from '@lazy-map/domain';
import { UserEntity } from '../entities/UserEntity';
import { UserMapper } from '../mappers/UserMapper';

/**
 * PostgreSQL implementation of the IUserRepository interface
 */
@Injectable()
export class PostgresUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repository: Repository<UserEntity>
  ) {}

  async save(user: User): Promise<void> {
    const entity = UserMapper.toPersistence(user);
    await this.repository.save(entity);
  }

  async findById(id: UserId): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { id: id.value }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { email: email.value }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByUsername(username: Username): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { username: username.value }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByGoogleId(googleId: GoogleId): Promise<User | null> {
    const entity = await this.repository.findOne({
      where: { googleId: googleId.getValue() }
    });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async emailExists(email: Email): Promise<boolean> {
    const count = await this.repository.count({
      where: { email: email.value }
    });
    return count > 0;
  }

  async usernameExists(username: Username): Promise<boolean> {
    const count = await this.repository.count({
      where: { username: username.value }
    });
    return count > 0;
  }

  async delete(id: UserId): Promise<void> {
    await this.repository.delete({ id: id.value });
  }

  async count(): Promise<number> {
    return await this.repository.count();
  }

  async findAll(options?: {
    role?: UserRole;
    status?: UserStatus;
    limit?: number;
    offset?: number;
    searchTerm?: string;
  }): Promise<User[]> {
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (options?.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.role.value });
    }

    if (options?.status) {
      queryBuilder.andWhere('user.status = :status', { status: options.status.value });
    }

    if (options?.searchTerm) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search)',
        { search: `%${options.searchTerm}%` }
      );
    }

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    if (options?.offset) {
      queryBuilder.offset(options.offset);
    }

    queryBuilder.orderBy('user.createdAt', 'DESC');

    const entities = await queryBuilder.getMany();
    return UserMapper.toDomainArray(entities);
  }

  async findByRole(role: UserRole): Promise<User[]> {
    const entities = await this.repository.find({
      where: { role: role.value },
      order: { createdAt: 'DESC' }
    });
    return UserMapper.toDomainArray(entities);
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const entities = await this.repository.find({
      where: { status: status.value },
      order: { createdAt: 'DESC' }
    });
    return UserMapper.toDomainArray(entities);
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
    const queryBuilder = this.repository.createQueryBuilder('user');

    if (options.role) {
      queryBuilder.andWhere('user.role = :role', { role: options.role.value });
    }

    if (options.status) {
      queryBuilder.andWhere('user.status = :status', { status: options.status.value });
    }

    if (options.searchTerm) {
      queryBuilder.andWhere(
        '(user.username ILIKE :search OR user.email ILIKE :search)',
        { search: `%${options.searchTerm}%` }
      );
    }

    const [entities, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(options.offset)
      .take(options.limit)
      .getManyAndCount();

    const users = UserMapper.toDomainArray(entities);
    const hasMore = options.offset + options.limit < total;

    return { users, total, hasMore };
  }

  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    pendingUsers: number;
    adminUsers: number;
  }> {
    const stats = await this.repository
      .createQueryBuilder('user')
      .select('user.status', 'status')
      .addSelect('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.status, user.role')
      .getRawMany();

    const result = {
      totalUsers: 0,
      activeUsers: 0,
      suspendedUsers: 0,
      pendingUsers: 0,
      adminUsers: 0
    };

    for (const stat of stats) {
      const count = parseInt(stat.count, 10);
      result.totalUsers += count;

      if (stat.status === 'active') {
        result.activeUsers += count;
      } else if (stat.status === 'suspended') {
        result.suspendedUsers += count;
      } else if (stat.status === 'pending') {
        result.pendingUsers += count;
      }

      if (stat.role === 'admin' || stat.role === 'superadmin') {
        result.adminUsers += count;
      }
    }

    return result;
  }
}