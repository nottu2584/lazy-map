#!/bin/bash
# Setup script for OAuth database

echo "🔧 Setting up OAuth database..."

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Please install or use Docker:"
    echo "   docker run --name lazy-map-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres"
    exit 1
fi

# Create database if it doesn't exist
echo "📦 Creating database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'lazy_map'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE lazy_map"

# Run migrations
echo "🔄 Running OAuth migrations..."
psql -U postgres -d lazy_map -f packages/infrastructure/src/adapters/persistence/postgres/migrations/20250109000001-create-oauth-tokens-table.sql
psql -U postgres -d lazy_map -f packages/infrastructure/src/adapters/persistence/postgres/migrations/20250109000002-create-pending-account-links-table.sql

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with OAuth credentials"
echo "2. Run: pnpm dev:backend"
echo "3. Test OAuth endpoints"
