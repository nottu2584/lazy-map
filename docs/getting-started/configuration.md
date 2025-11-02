# Configuration

Set up environment variables for Lazy Map.

## Environment Files

Create a `.env` file in the project root:

```bash
# Core Settings
NODE_ENV=development
PORT=3000

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/lazymap

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# JWT (for authentication)
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

## Configuration Options

### Required Variables

None! The app works without configuration for basic map generation.

### Optional Features

**Database**: Enable map persistence
- Set `DATABASE_URL` to your PostgreSQL connection string
- Run migrations: `pnpm run migration:run`

**Authentication**: Enable user accounts
- Configure Google OAuth credentials
- Set JWT secret for token generation

## Environment Strategy

- **Development**: Uses `.env` file
- **Production**: Use environment variables from hosting platform
- **Testing**: Uses `.env.test` file

## Next Steps

- [Generate your first map](./first-map.md)
- [Setup database](../guides/database-setup.md) for persistence