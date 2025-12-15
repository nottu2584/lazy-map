# OAuth Security Fix - Summary

## Issue Identified
User-controlled `redirectUri` parameters in OAuth callback endpoints created multiple security vulnerabilities:
- **Open Redirect**: Attackers could redirect users to phishing sites
- **Authorization Code Interception**: Codes could be sent to malicious servers
- **Token Leakage**: JWT tokens could be stolen via attacker-controlled URLs

## Changes Implemented

### 1. Environment Configuration
**Files**: `.env`, `.env.example`
- Added `GOOGLE_OAUTH_REDIRECT_URI` - Backend callback URL for Google
- Added `DISCORD_OAUTH_REDIRECT_URI` - Backend callback URL for Discord  
- Added `ALLOWED_FRONTEND_URLS` - Whitelist for post-auth redirects

### 2. OAuth Services
**Files**: `GoogleOAuthService.ts`, `DiscordOAuthService.ts`
- Services now use **configured** redirect URIs from constructor
- Removed user input from `getAuthorizationUrl()` and `exchangeCodeForTokens()`
- User-provided redirectUri parameters are now **ignored**

### 3. Service Factories
**Files**: `GoogleOAuthService.ts`, `DiscordOAuthService.ts`
- Factory functions now require `redirectUri` parameter
- Added validation to ensure redirect URI is provided

### 4. Infrastructure Module
**File**: `infrastructure.module.ts`
- Updated OAuth service providers to read redirect URIs from config
- Added validation warnings if redirect URIs are missing

### 5. Auth Controller
**File**: `auth.controller.ts`
- **Removed** `redirectUri` query parameter from:
  - `/auth/google/login`
  - `/auth/discord/login`
  - `/auth/google/callback`
  - `/auth/discord/callback`
- Services now handle redirect URIs internally

## Security Improvements

### Before (Vulnerable)
```typescript
GET /auth/google/callback?code=abc&redirectUri=https://evil.com
// ❌ User controls where they get redirected
```

### After (Secure)
```typescript
GET /auth/google/callback?code=abc
// ✅ Redirect URI comes from .env config
// ✅ Must match what's registered with OAuth provider
// ✅ No user manipulation possible
```

## Configuration Required

Update your OAuth provider settings to use the backend callback URLs:

**Google Console** (https://console.cloud.google.com)
- Authorized redirect URIs: `http://localhost:3030/api/auth/google/callback`

**Discord Developer Portal** (https://discord.com/developers)
- Redirect URIs: `http://localhost:3030/api/auth/discord/callback`

## Next Steps (Optional Enhancements)

1. **Frontend URL Validation**: Use `state` parameter to encode and validate frontend return URLs
2. **CSRF Protection**: Implement proper state parameter validation
3. **Rate Limiting**: Add rate limiting to OAuth endpoints
4. **Audit Logging**: Log all OAuth attempts with IP addresses

## Testing Checklist

- [ ] OAuth services initialize with redirect URIs
- [ ] Google OAuth flow completes successfully
- [ ] Discord OAuth flow completes successfully
- [ ] Frontend receives tokens after OAuth
- [ ] Attempting to manipulate URLs fails gracefully
