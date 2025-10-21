import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { UserEntity, MapEntity, MapHistoryEntity } from './entities';

/**
 * Database configuration for PostgreSQL
 * Uses environment variables for sensitive information
 */
export const getDatabaseConfig = (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'lazy_map',

    // Entity configuration
    entities: [UserEntity, MapEntity, MapHistoryEntity],

    // Synchronize in development only (use migrations in production)
    synchronize: isDevelopment && process.env.DB_SYNCHRONIZE !== 'false',

    // Logging configuration
    logging: process.env.DB_LOGGING === 'true',
    logger: isProduction ? 'file' : 'debug',

    // Connection pool configuration
    extra: {
      max: parseInt(process.env.DB_POOL_MAX || '10', 10),
      min: parseInt(process.env.DB_POOL_MIN || '2', 10),
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000', 10),
    },

    // SSL configuration for production
    ssl: isProduction && process.env.DB_SSL !== 'false'
      ? {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
        }
      : false,

    // Migration configuration
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    migrationsRun: isProduction,

    // Additional options
    retryAttempts: 3,
    retryDelay: 3000,
    autoLoadEntities: false,
  };
};

/**
 * Configuration for TypeORM CLI
 */
export const dataSourceOptions = {
  ...getDatabaseConfig(),
  migrations: ['src/migrations/*.ts'],
  cli: {
    migrationsDir: 'src/migrations',
  },
};