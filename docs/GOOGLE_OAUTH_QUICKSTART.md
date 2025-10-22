# Google OAuth Quick Start Guide

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
     - `http://localhost:3000` (backend)
     - `http://localhost:5173` (frontend)
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback`
   - Copy the Client ID and Client Secret

3. **Configure Environment Variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   JWT_SECRET=your-secure-jwt-secret
   ```

## Running the Application

1. **Start Database Services**
   ```bash
   docker-compose up -d
   ```

2. **Run Database Migration**
   ```bash
   # Apply the OAuth schema changes
   psql -h localhost -p 5432 -U postgres -d lazy_map < packages/infrastructure/src/adapters/persistence/postgres/migrations/add-oauth-support.sql
   ```

3. **Start the Backend**
   ```bash
   pnpm run dev:backend
   ```

4. **Start the Frontend**
   ```bash
   pnpm run dev:frontend
   ```

## Testing the OAuth Endpoints

### 1. Google Sign-In
```bash
# POST /auth/google
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN_FROM_FRONTEND"
  }'
```

Expected Response:
```json
{
  "accessToken": "jwt.token.here",
  "user": {
    "id": "user-uuid",
    "email": "user@gmail.com",
    "username": "john"
  }
}
```

### 2. Link Google Account (Requires Authentication)
```bash
# POST /auth/link-google
curl -X POST http://localhost:3000/auth/link-google \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "idToken": "GOOGLE_ID_TOKEN"
  }'
```

Expected Response:
```json
{
  "success": true,
  "message": "Google account linked successfully"
}
```

## Troubleshooting

### Common Issues

1. **Invalid Google Token Error**
   - Ensure the Client ID matches between frontend and backend
   - Check that the token hasn't expired
   - Verify the domain is in authorized origins

2. **Database Connection Issues**
   - Ensure PostgreSQL is running: `docker ps`
   - Check database exists: `docker exec -it lazy-map-postgres psql -U postgres -c "\l"`
   - Verify migrations have been applied

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set in .env
   - Check token expiration settings
   - Verify the token format in Authorization header

## Security Checklist

- ✅ Never expose GOOGLE_CLIENT_SECRET to frontend
- ✅ Always validate tokens server-side
- ✅ Use HTTPS in production
- ✅ Implement rate limiting on auth endpoints
- ✅ Store JWT tokens securely (httpOnly cookies recommended)
- ✅ Validate email verification status
- ✅ Log authentication attempts for security monitoring

