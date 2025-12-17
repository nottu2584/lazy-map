import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity, MapEntity, MapHistoryEntity, OAuthTokenEntity } from './entities';
import { PostgresUserRepository, PostgresOAuthTokenRepository } from './repositories';

/**
 * Database module for PostgreSQL integration
 * Provides TypeORM configuration and repository implementations
 *
 * Note: PostgresMapRepository is provided in ApplicationModule
 * because it depends on GenerateTacticalMapUseCase
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
    PostgresOAuthTokenRepository,

    // Provide repositories with domain interface tokens
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository,
    },
    {
      provide: 'IOAuthTokenRepository',
      useClass: PostgresOAuthTokenRepository,
    },
  ],
  exports: [
    // Export TypeOrmModule so other modules can inject TypeORM repositories
    TypeOrmModule,
    PostgresUserRepository,
    PostgresOAuthTokenRepository,
    'IUserRepository',
    'IOAuthTokenRepository',
  ],
})
export class DatabaseModule {}