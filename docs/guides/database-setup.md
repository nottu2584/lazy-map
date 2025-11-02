# Database Setup Guide

## Overview

Lazy Map uses PostgreSQL as its primary database for storing user data and map generation parameters. The application follows a cost-efficient approach by storing only the generation parameters (seeds, settings) rather than the full map data, leveraging deterministic generation to recreate maps on demand.

## Quick Start

### Using Docker (Recommended for Development)

1. **Start the database services:**
   ```bash
   docker-compose up -d
   ```

   This will start:
   - PostgreSQL on port 5432
   - Redis on port 6379 (for caching)

2. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Run migrations:**
   ```bash
   pnpm run migration:run
   ```

### Manual PostgreSQL Installation

1. **Install PostgreSQL 15+**
   - macOS: `brew install postgresql@15`
   - Ubuntu: `sudo apt install postgresql-15`
   - Windows: Download from https://www.postgresql.org/download/windows/

2. **Create the database:**
   ```sql
   CREATE DATABASE lazy_map;
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

## Environment Configuration

Key database environment variables:

```env
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lazy_map

# Development Settings
DB_SYNCHRONIZE=true    # Auto-sync schema in dev
DB_LOGGING=true        # Enable query logging

# Production Settings
DB_SYNCHRONIZE=false   # Use migrations in production
DB_SSL=true            # Enable SSL for production
```

## Database Schema

### Core Tables

1. **users**
   - Stores user authentication and profile data
   - Tracks subscription tiers and map generation limits

2. **maps**
   - Stores map generation parameters (seed, dimensions, settings)
   - Does NOT store actual tile data (regenerated on demand)
   - Links to user ownership

3. **map_history**
   - Tracks user interactions with maps
   - Used for analytics and recommendations

### Data Storage Strategy

Instead of storing the full map data (which could be several MB per map), we store:
- **Seed**: The deterministic generation seed (e.g., "my-awesome-dungeon")
- **Settings**: JSON object with generation parameters
- **Metadata**: Name, description, tags, timestamps

This approach reduces storage costs by 99% while maintaining instant map regeneration.

## Migrations

### Create a new migration:
```bash
pnpm run migration:generate -- --name=YourMigrationName
```

### Run pending migrations:
```bash
pnpm run migration:run
```

### Revert last migration:
```bash
pnpm run migration:revert
```

## Database Management

### Connection Details:
Use these credentials with your preferred database tool:
- **Host**: localhost
- **Port**: 5432
- **Database**: lazy_map
- **Username**: postgres
- **Password**: postgres

### CLI Access:
```bash
# Direct access via Docker
docker exec -it lazy-map-postgres psql -U postgres -d lazy_map

# Using local psql client
psql -h localhost -p 5432 -U postgres -d lazy_map
```

### GUI Tools:
Connect using any PostgreSQL client:
- **DBeaver**: Free, cross-platform
- **TablePlus**: Modern, native apps
- **pgAdmin**: PostgreSQL-specific
- **DataGrip**: JetBrains IDE
- **VS Code**: PostgreSQL extensions available

### Backup database:
```bash
docker exec lazy-map-postgres pg_dump -U postgres lazy_map > backup.sql
```

### Restore database:
```bash
docker exec -i lazy-map-postgres psql -U postgres lazy_map < backup.sql
```

## Production Deployment

### Recommended Services

1. **Supabase** (Recommended for startups)
   - Free tier: 500MB storage, 2GB bandwidth
   - Built-in auth and real-time features
   - Automatic backups

2. **Neon**
   - Serverless PostgreSQL
   - Auto-scaling
   - Pay-per-use pricing

3. **AWS RDS**
   - Enterprise-grade reliability
   - Multi-AZ deployments
   - Higher cost but maximum control

### Production Checklist

- [ ] Set `DB_SYNCHRONIZE=false`
- [ ] Enable SSL with `DB_SSL=true`
- [ ] Configure connection pooling
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Run migrations before deployment
- [ ] Set appropriate resource limits

## Performance Optimization

### Indexes
The following indexes are automatically created:
- `users.email` (unique)
- `users.username` (unique)
- `maps.seed`
- `maps.userId`
- `map_history.userId`
- `map_history.createdAt`

### Caching Strategy
- Recent maps cached in Redis (24-48 hour TTL)
- User sessions stored in Redis
- Frequently accessed maps cached in memory

## Troubleshooting

### Connection refused
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart services
docker-compose restart postgres
```

### Migration errors
```bash
# Reset database (DEVELOPMENT ONLY)
docker-compose down -v
docker-compose up -d
pnpm run migration:run
```

### Performance issues
```bash
# Check database size
docker exec lazy-map-postgres psql -U postgres -d lazy_map -c "SELECT pg_size_pretty(pg_database_size('lazy_map'));"

# Analyze query performance
# Set DB_LOGGING=true in .env to see all queries
```

## Support

For database-related issues:
1. Check this guide first
2. Review logs: `docker-compose logs postgres`
3. Open an issue: https://github.com/yourusername/lazy-map/issues