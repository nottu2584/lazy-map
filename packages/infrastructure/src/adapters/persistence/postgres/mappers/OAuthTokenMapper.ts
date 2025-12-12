import { OAuthToken, UserId } from '@lazy-map/domain';
import { OAuthTokenEntity } from '../entities/OAuthTokenEntity';

/**
 * Mapper between OAuthToken domain model and OAuthTokenEntity persistence model
 */
export class OAuthTokenMapper {
  /**
   * Convert domain model to persistence entity
   */
  static toPersistence(token: OAuthToken): OAuthTokenEntity {
    const entity = new OAuthTokenEntity();

    entity.id = token.id;
    entity.userId = token.userId.value;
    entity.provider = token.provider;
    entity.accessToken = token.accessToken;
    entity.refreshToken = token.refreshToken;
    entity.tokenType = token.tokenType;
    entity.expiresAt = token.expiresAt;
    entity.scope = token.scope;
    entity.createdAt = token.createdAt;
    entity.updatedAt = token.updatedAt;

    return entity;
  }

  /**
   * Convert persistence entity to domain model
   */
  static toDomain(entity: OAuthTokenEntity): OAuthToken {
    return OAuthToken.fromPersistence(
      entity.id,
      UserId.fromString(entity.userId),
      entity.provider as 'google' | 'discord',
      entity.accessToken,
      entity.refreshToken,
      entity.tokenType,
      entity.expiresAt,
      entity.scope,
      entity.createdAt,
      entity.updatedAt
    );
  }
}
