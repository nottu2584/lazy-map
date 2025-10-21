import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './database.config';
import { UserEntity, MapEntity, MapHistoryEntity } from './entities';
import { PostgresUserRepository, PostgresMapRepository } from './repositories';

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
    TypeOrmModule.forFeature([UserEntity, MapEntity, MapHistoryEntity]),
  ],
  providers: [
    // Repository providers
    PostgresUserRepository,
    PostgresMapRepository,

    // Provide repositories with domain interface tokens
    {
      provide: 'IUserRepository',
      useClass: PostgresUserRepository,
    },
    {
      provide: 'IMapRepository',
      useClass: PostgresMapRepository,
    },
  ],
  exports: [
    // Export for use in other modules
    TypeOrmModule,
    PostgresUserRepository,
    PostgresMapRepository,
    'IUserRepository',
    'IMapRepository',
  ],
})
export class DatabaseModule {}