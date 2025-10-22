# Database Migrations

This directory contains SQL migration scripts for the PostgreSQL database.

## Migration Files

- `001-initial-schema.sql` - Creates the initial database schema (users, maps, map_history tables)
- `add-oauth-support.sql` - Adds OAuth support columns to the users table

## Running Migrations

### Manual Execution

1. Ensure PostgreSQL is running:
```bash
docker-compose up -d postgres
```

2. Connect to the database and run migrations:
```bash
# Connect to database
docker exec -it lazy-map-postgres psql -U postgres -d lazy_map

# Run migrations (from within psql)
\i /docker-entrypoint-initdb.d/001-initial-schema.sql
\i /docker-entrypoint-initdb.d/add-oauth-support.sql
```

### Automatic Execution

When `DB_SYNCHRONIZE=true` is set in the backend `.env` file, TypeORM will automatically synchronize the schema based on the entity definitions.

For production, set `DB_SYNCHRONIZE=false` and run migrations manually.

## Creating New Migrations

1. Create a new SQL file following the naming pattern: `XXX-description.sql`
2. Include a header comment with migration name and description
3. Use `IF NOT EXISTS` clauses to make migrations idempotent
4. Add appropriate indexes for foreign keys and frequently queried columns
5. Document columns with COMMENT statements

## Migration Best Practices

- Always make migrations reversible when possible
- Test migrations on a local database first
- Never modify existing migration files once deployed
- Use transactions for complex migrations
- Include both up and down migrations (in separate files if needed)