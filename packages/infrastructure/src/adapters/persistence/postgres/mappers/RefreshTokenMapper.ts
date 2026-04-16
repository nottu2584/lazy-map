import { RefreshToken, UserId } from '@lazy-map/domain';
import { RefreshTokenEntity } from '../entities/RefreshTokenEntity';

/**
 * Maps between RefreshToken domain entity and RefreshTokenEntity persistence
 */
export class RefreshTokenMapper {
  static toDomain(entity: RefreshTokenEntity): RefreshToken {
    return RefreshToken.reconstitute(
      entity.id,
      UserId.fromString(entity.userId),
      entity.tokenHash,
      entity.expiresAt,
      entity.createdAt,
      entity.revokedAt,
      entity.replacedByTokenId,
      entity.userAgent,
      entity.ipAddress,
    );
  }

  static toPersistence(domain: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();
    entity.id = domain.id;
    entity.userId = domain.userId.value;
    entity.tokenHash = domain.tokenHash;
    entity.expiresAt = domain.expiresAt;
    entity.createdAt = domain.createdAt;
    entity.revokedAt = domain.revokedAt;
    entity.replacedByTokenId = domain.replacedByTokenId;
    entity.userAgent = domain.userAgent;
    entity.ipAddress = domain.ipAddress;
    return entity;
  }
}
