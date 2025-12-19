import { DataSource } from 'typeorm';
import { UserEntity, MapEntity, MapHistoryEntity, OAuthTokenEntity } from './entities';

/**
 * DataSource configuration for TypeORM CLI
 * Used for running migrations via CLI commands
 *
 * This is separate from database.config.ts which is used at runtime by NestJS
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'lazy_map',

  // Entity configuration
  entities: [UserEntity, MapEntity, MapHistoryEntity, OAuthTokenEntity],

  // Migration configuration
  migrations: [__dirname + '/migrations/*.ts'],
  migrationsTableName: 'migrations',

  // CLI should never auto-sync - use migrations only
  synchronize: false,

  // Logging for migration visibility
  logging: ['error', 'warn', 'migration'],
});
