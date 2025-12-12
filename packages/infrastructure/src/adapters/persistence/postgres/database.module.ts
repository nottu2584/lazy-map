import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity, MapEntity, MapHistoryEntity, OAuthTokenEntity } from './entities';
import { PostgresUserRepository, PostgresMapRepository, PostgresOAuthTokenRepository } from './repositories';

/**
 * Database module for PostgreSQL integration
 * Provides TypeORM configuration and repository implementations
 */
@Global()
@Module({
  imports: [
    // Configure TypeORM with PostgreSQL
    TypeOrmModule.forRootAsync({
      useFactory: () => getDatabaseConfig(),
    }),
    // Register entities for repository injection
    TypeOrmModule.forFeature([UserEntity, MapEntity, MapHistoryEntity, OAuthTokenEntity]),
  ],
  providers: [
    // Repository providers
    PostgresUserRepository,
    PostgresMapRepository,
    PostgresOAuthTokenRepository,

    // Provide repositories with domain interface tokens
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository,
    },
    {
      provide: 'IMapRepository',
      useClass: PostgresMapRepository,
    },
    {
      provide: 'IOAuthTokenRepository',
      useClass: PostgresOAuthTokenRepository,
    },
  ],
  exports: [
    // Export for use in other modules
    TypeOrmModule,
    PostgresUserRepository,
    PostgresMapRepository,
    PostgresOAuthTokenRepository,
    'IUserRepository',
    'IMapRepository',
    'IOAuthTokenRepository',
  ],
})
export class DatabaseModule {}