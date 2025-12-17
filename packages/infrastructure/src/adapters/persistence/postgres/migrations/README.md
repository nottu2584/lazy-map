# TypeORM Migrations

This directory contains TypeORM migration files for the PostgreSQL database.

## Migration System

We use TypeORM's migration system for versioned database schema changes:
- ✅ Automated migration tracking (`migrations` table)
- ✅ Type-safe migrations (TypeScript classes)
- ✅ Rollback capability
- ✅ Version control for schema changes

## Quick Start

### 1. Initial Setup

```bash
# Ensure PostgreSQL is running
pg_isready -h localhost -p 5432

# Set environment variables in apps/backend/.env
USE_DATABASE=true
DB_SYNCHRONIZE=false  # Use migrations, not auto-sync
```

### 2. Run Migrations

```bash
cd apps/backend

# Show pending migrations
pnpm migration:show

# Run all pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert
```

## Creating Migrations

### Generate Migration from Entity Changes

```bash
cd apps/backend

# Generate migration by comparing entities to current database
pnpm migration:generate -- ../../packages/infrastructure/src/adapters/persistence/postgres/migrations/MyMigration

# Example:
pnpm migration:generate -- ../../packages/infrastructure/src/adapters/persistence/postgres/migrations/AddUserRoles
```

This creates a timestamped file like: `1234567890-AddUserRoles.ts`

### Create Empty Migration

```bash
cd apps/backend

# Create empty migration file for custom SQL
pnpm migration:create -- ../../packages/infrastructure/src/adapters/persistence/postgres/migrations/CustomChanges
```

## Migration File Structure

```typescript
import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1234567890 implements MigrationInterface {
    name = 'InitialSchema1234567890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SQL to apply the migration
        await queryRunner.query(`CREATE TABLE...`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // SQL to revert the migration
        await queryRunner.query(`DROP TABLE...`);
    }
}
```

## Migration Best Practices

1. **Never modify existing migrations** once deployed
2. **Always test migrations** on local database first
3. **Write down() method** for rollback capability
4. **Use transactions** for complex changes (TypeORM does this automatically)
5. **Review generated SQL** before committing

## Common Commands

```bash
# Show migration status
pnpm migration:show

# Run all pending migrations
pnpm migration:run

# Revert last migration
pnpm migration:revert

# Generate from entity changes
pnpm migration:generate -- ../../packages/infrastructure/src/adapters/persistence/postgres/migrations/MyMigration

# Create empty migration
pnpm migration:create -- ../../packages/infrastructure/src/adapters/persistence/postgres/migrations/MyMigration
```

## Troubleshooting

### "No changes in database schema"
- Your entities match the database schema
- No migration needed

### "Migration already executed"
- Check `migrations` table to see executed migrations
- Use `pnpm migration:show` to see status

### "Cannot run migrations, schema out of sync"
- Drop database and run migrations from scratch (development only)
- Or manually fix schema to match entities

## Architecture Notes

This follows Clean Architecture principles:
- **Location**: `packages/infrastructure` (external concern)
- **Runtime config**: `database.config.ts` (used by NestJS)
- **CLI config**: `datasource.config.ts` (used by TypeORM CLI)
- **Execution**: Migration scripts in `apps/backend/package.json`
