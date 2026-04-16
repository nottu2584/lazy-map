import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, IsNull, Repository } from 'typeorm';
import { IRefreshTokenRepository, RefreshToken, UserId } from '@lazy-map/domain';
import { RefreshTokenEntity } from '../entities/RefreshTokenEntity';
import { RefreshTokenMapper } from '../mappers/RefreshTokenMapper';

@Injectable()
export class PostgresRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly repository: Repository<RefreshTokenEntity>,
  ) {}

  async save(token: RefreshToken): Promise<void> {
    const entity = RefreshTokenMapper.toPersistence(token);
    await this.repository.save(entity);
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    const entity = await this.repository.findOne({ where: { tokenHash } });
    return entity ? RefreshTokenMapper.toDomain(entity) : null;
  }

  async findActiveByUser(userId: UserId): Promise<RefreshToken[]> {
    const entities = await this.repository.find({
      where: {
        userId: userId.value,
        revokedAt: IsNull(),
      },
    });

    return entities
      .map(RefreshTokenMapper.toDomain)
      .filter((token) => !token.isExpired());
  }

  async revokeAllByUser(userId: UserId): Promise<void> {
    await this.repository.update(
      { userId: userId.value, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  async deleteExpired(): Promise<void> {
    await this.repository.delete({
      expiresAt: LessThan(new Date()),
    });
  }
}
