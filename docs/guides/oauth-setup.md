# OAuth Setup Guide

## Setup Google Cloud Console

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Identity API

2. **Create OAuth 2.0 Credentials**
   - Navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:3030` (backend)
     - `http://localhost:5173` (frontend)
   - Add authorized redirect URIs:
     - `http://localhost:3030/api/auth/google/callback`
   - Copy the Client ID and Client Secret

3. **Configure Environment Variables**
   ```bash
   cp apps/backend/.env.example apps/backend/.env
   ```

   Edit `apps/backend/.env` and add:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   JWT_SECRET=your-secure-jwt-secret
   ```

## Setup Discord OAuth

1. **Create a Discord Application**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Navigate to "OAuth2" settings
   - Add redirect URI: `http://localhost:3030/api/auth/discord/callback`
   - Copy the Client ID and Client Secret

2. **Configure Environment Variables**

   Add to `apps/backend/.env`:
   ```env
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   ```

## Running the Application

1. **Start Database Services**
   ```bash
   docker compose up -d postgres
   ```

2. **Run Database Migrations**
   ```bash
   cd apps/backend && pnpm migration:run
   ```

3. **Start the Backend**
   ```bash
   cd apps/backend && pnpm dev
   ```

4. **Start the Frontend**
   ```bash
   cd apps/frontend && pnpm dev
   ```

## OAuth Flow

The application uses server-side OAuth (authorization code flow):

1. Frontend calls `GET /api/auth/google/login` or `GET /api/auth/discord/login`
2. Backend returns an `authorizationUrl` for the OAuth provider
3. Frontend opens the authorization URL (popup or redirect)
4. User authenticates with the provider
5. Provider redirects to backend callback with authorization code
6. Backend exchanges the code for tokens server-side
7. Backend creates/finds user account and returns a JWT

## Troubleshooting

### Common Issues

1. **OAuth Callback Errors**
   - Ensure redirect URIs match exactly between provider console and backend config
   - Check that Client ID and Secret are correct in `.env`

2. **Database Connection Issues**
   - Ensure PostgreSQL is running: `docker ps`
   - Check database exists: `docker exec -it lazy-map-postgres psql -U postgres -c "\l"`
   - Verify migrations have been applied

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in `.env`
   - Check token expiration settings
   - Verify the token format in Authorization header

## Security Checklist

- Never expose Client Secrets to frontend
- All token exchange happens server-side (authorization code flow)
- Use HTTPS in production
- Implement rate limiting on auth endpoints
- Store JWT tokens securely (httpOnly cookies recommended)
- Validate email verification status
- Log authentication attempts for security monitoring
