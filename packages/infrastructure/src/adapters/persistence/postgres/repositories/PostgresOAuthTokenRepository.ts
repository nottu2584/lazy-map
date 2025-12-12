import { Repository, LessThan } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IOAuthTokenRepository, OAuthToken, UserId } from '@lazy-map/domain';
import { OAuthTokenEntity } from '../entities/OAuthTokenEntity';
import { OAuthTokenMapper } from '../mappers/OAuthTokenMapper';

/**
 * PostgreSQL implementation of the IOAuthTokenRepository interface
 */
@Injectable()
export class PostgresOAuthTokenRepository implements IOAuthTokenRepository {
  constructor(
    @InjectRepository(OAuthTokenEntity)
    private readonly repository: Repository<OAuthTokenEntity>
  ) {}

  async save(token: OAuthToken): Promise<void> {
    const entity = OAuthTokenMapper.toPersistence(token);
    await this.repository.save(entity);
  }

  async findByUserAndProvider(
    userId: UserId,
    provider: 'google' | 'discord'
  ): Promise<OAuthToken | null> {
    const entity = await this.repository.findOne({
      where: {
        userId: userId.value,
        provider
      }
    });

    return entity ? OAuthTokenMapper.toDomain(entity) : null;
  }

  async findByUser(userId: UserId): Promise<OAuthToken[]> {
    const entities = await this.repository.find({
      where: {
        userId: userId.value
      }
    });

    return entities.map(entity => OAuthTokenMapper.toDomain(entity));
  }

  async deleteByUserAndProvider(
    userId: UserId,
    provider: 'google' | 'discord'
  ): Promise<void> {
    await this.repository.delete({
      userId: userId.value,
      provider
    });
  }

  async deleteByUser(userId: UserId): Promise<void> {
    await this.repository.delete({
      userId: userId.value
    });
  }

  async findExpired(): Promise<OAuthToken[]> {
    const entities = await this.repository.find({
      where: {
        expiresAt: LessThan(new Date())
      }
    });

    return entities.map(entity => OAuthTokenMapper.toDomain(entity));
  }
}
