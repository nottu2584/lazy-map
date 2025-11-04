# OAuth Architecture Modernization & Discord Integration

> Modernize auth architecture to support multiple OAuth providers, improve security, and add Discord as a second provider.

## Status & Metadata

- **Status**: Planned
- **Priority**: High (Security improvements + Feature addition)
- **Effort**: 2-3 weeks
- **Architecture Impact**: Application/Infrastructure/Interface (Major refactoring)
- **Owner**: TBD
- **Related**: See `/docs/architecture/auth-analysis.md` for detailed analysis

## Problem & Goals

### Problem Statement
The current authentication architecture has several issues that need addressing before adding more OAuth providers:
1. **OAuth is Google-specific** - Can't support multiple providers without refactoring
2. **Security gaps** - No rate limiting, no global auth guard, no refresh tokens
3. **Duplicate guards** - Confusing mock `AuthGuard` alongside real `JwtAuthGuard`
4. **No caching** - Missing performance optimization for token validation
5. **Mixed concerns** - OAuth service handles both OAuth AND JWT operations

Adding Discord OAuth exposes these architectural problems, so we'll fix them first.

### Goals
- **Phase 1**: Fix auth architecture issues (security, patterns, separation of concerns)
- **Phase 2**: Implement unified OAuth architecture with caching
- **Phase 3**: Add Discord as second OAuth provider
- Allow users to choose between Google or Discord for sign-in/registration
- Support linking OAuth accounts to existing users
- Maintain backward compatibility with existing users

### Out of Scope
- Other OAuth providers (GitHub, Microsoft) - will be easy to add after this refactoring
- Social features or Discord integration beyond authentication
- Refresh tokens (medium priority, separate feature)
- Password reset flow (medium priority, separate feature)

## Current State

**Existing OAuth Implementation**:
- Google OAuth fully implemented with token validation via `google-auth-library`
- `IOAuthService` domain interface defines OAuth contract
- `GoogleOAuthService` infrastructure implementation
- `GoogleSignInUseCase` and `LinkGoogleAccountUseCase` in application layer
- `AuthController` has `/auth/google` and `/auth/link-google` endpoints
- Domain already has `AuthProvider` value object with `DISCORD` constant defined
- Frontend has basic login form (no OAuth UI yet)

**Pain Points**:
- Limited authentication options for users
- `IOAuthService` is Google-specific (has `validateGoogleToken` method)
- Frontend doesn't show OAuth provider options

## Proposed Solution

Extend the existing OAuth architecture to support multiple providers with Discord as the second implementation.

### Key Components

**Domain Layer** (`packages/domain/src/contexts/user/`):
- Refactor `IOAuthService` to be provider-agnostic
- Add `DiscordUserInfo` interface
- Add `DiscordId` value object (similar to `GoogleId`)

**Application Layer** (`packages/application/src/contexts/user/`):
- `DiscordSignInUseCase` - mirrors `GoogleSignInUseCase` logic
- `LinkDiscordAccountUseCase` - mirrors `LinkGoogleAccountUseCase` logic
- `DiscordSignInCommand` and `LinkDiscordAccountCommand`

**Infrastructure Layer** (`packages/infrastructure/src/contexts/user/`):
- `DiscordOAuthService` - implements OAuth token validation using Discord API
- Uses Discord OAuth2 flow with `discord.js` or direct API calls

**Interface Layer** (`apps/backend/src/modules/auth/`):
- Add `/auth/discord` endpoint
- Add `/auth/link-discord` endpoint
- Add `DiscordSignInDto` and `LinkDiscordAccountDto`

**Frontend** (`apps/frontend/src/`):
- Add OAuth provider selection UI
- Integrate Discord OAuth button
- Handle Discord OAuth redirect flow

**Technology**:
- Discord OAuth2 API (https://discord.com/developers/docs/topics/oauth2)
- Optional: `discord-oauth2` npm package for helper utilities

## Architecture Impact

- [x] **Domain**: Generic OAuth interfaces, provider-agnostic value objects and use cases
- [x] **Application**: Unified OAuth sign-in and linking use cases (no provider-specific logic)
- [x] **Infrastructure**: Base OAuth service + provider-specific implementations
- [x] **Interface**: Generic `/auth/oauth/:provider` endpoints, unified DTOs

**Key Decisions**:
1. **Unified OAuth architecture with provider-specific implementations**: Create an abstract `BaseOAuthService` with common patterns (caching, rate limiting, error handling) while allowing provider-specific token validation
2. **Universal caching strategy**: Implement caching for ALL OAuth providers (Google + Discord + future) for consistency, performance, and observability - even though Google doesn't strictly require it
3. **Standardized interfaces**: Use template method pattern and strategy pattern to handle provider differences while maintaining consistent API
4. **Configuration-driven behavior**: Rate limits, cache TTL, and retry strategies configured per provider rather than hard-coded

## Unified OAuth Pattern Architecture

### Design Pattern: Template Method + Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    Domain Layer                            │
├────────────────────────────────────────────────────────────┤
│  IOAuthService (interface)                                 │
│  - validateAndCacheToken(provider, token)                  │
│  - generateAuthToken(user)                                 │
│                                                            │
│  IOAuthProvider (interface)                                │
│  - validateToken(token): OAuthUserInfo                     │
│                                                            │
│  OAuthUserInfo (generic interface)                         │
│  - providerId, email, emailVerified, provider...           │
└────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 Application Layer                          │
├────────────────────────────────────────────────────────────┤
│  OAuthSignInUseCase                                        │
│  - execute(OAuthSignInCommand)                             │
│  - Works for ANY provider (google, discord, github)        │
│                                                            │
│  LinkOAuthAccountUseCase                                   │
│  - execute(LinkOAuthAccountCommand)                        │
│  - Provider-agnostic linking logic                         │
└────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│              Infrastructure Layer                          │
├────────────────────────────────────────────────────────────┤
│  BaseOAuthService (abstract class)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Common Logic (Template Method)                       │  │
│  │ - validateAndCacheToken() {                          │  │
│  │     1. Check cache                                   │  │
│  │     2. validateTokenWithProvider() [abstract]        │  │
│  │     3. Cache result                                  │  │
│  │     4. Monitor rate limits                           │  │
│  │   }                                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                │
│         ┌─────────────────┼─────────────────┐              │
│         ▼                 ▼                 ▼              │
│  GoogleOAuthProvider  DiscordOAuthProvider  GitHubProvider │
│  - JWT validation    - API call           - API call       │
│  - No rate limits    - Strict limits      - Moderate       │
│  - Offline          - Online              - Online         │
└────────────────────────────────────────────────────────────┘
                            ▼
┌────────────────────────────────────────────────────────────┐
│                 Interface Layer                            │
├────────────────────────────────────────────────────────────┤
│  AuthController                                            │
│  POST /auth/oauth/:provider                                │
│  POST /auth/oauth/:provider/link                           │
│  - Provider parameter routes to correct implementation     │
└────────────────────────────────────────────────────────────┘
```

### Why This Pattern?

**Standardization Benefits:**
- ✅ Same caching for all (even Google)
- ✅ Consistent error handling
- ✅ Unified monitoring and metrics
- ✅ Single set of tests
- ✅ Easy to add new providers

**Flexibility Where Needed:**
- ✅ Provider-specific token validation
- ✅ Per-provider rate limit strategies
- ✅ Configurable cache TTL
- ✅ Provider-specific retry logic

**Clean Architecture Compliance:**
- ✅ Domain defines contracts (interfaces)
- ✅ Application orchestrates (provider-agnostic)
- ✅ Infrastructure implements (provider-specific)
- ✅ Interface exposes unified API

## Implementation Plan

### Phase 0: Auth Architecture Cleanup (Days 1-3) ⚠️ **Must Do First**

**Objective**: Fix current auth issues and establish proper security patterns

**Deliverables**:
- [ ] **Remove duplicate `AuthGuard`**:
  - Delete `/apps/backend/src/modules/auth/auth.guard.ts` (mock implementation)
  - Update imports to use only `JwtAuthGuard`
  - Remove from `auth.module.ts` providers

- [ ] **Implement global authentication with `@Public()` decorator**:
  ```typescript
  // Create decorators/public.decorator.ts
  import { SetMetadata } from '@nestjs/common';
  export const IS_PUBLIC_KEY = 'isPublic';
  export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
  
  // Update jwt-auth.guard.ts
  @Injectable()
  export class JwtAuthGuard extends AuthGuard('jwt') {
    constructor(private reflector: Reflector) {
      super();
    }
    
    canActivate(context: ExecutionContext) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()]
      );
      if (isPublic) return true;
      return super.canActivate(context);
    }
  }
  
  // Apply globally in main.ts
  const reflector = app.get(Reflector);
  app.useGlobalGuards(new JwtAuthGuard(reflector));
  
  // Mark public endpoints
  @Public()
  @Post('login')
  async login() { ... }
  ```

- [ ] **Add rate limiting** using `@nestjs/throttler`:
  ```bash
  npm install @nestjs/throttler
  ```
  ```typescript
  // app.module.ts
  ThrottlerModule.forRoot({ ttl: 60, limit: 10 })
  
  // auth.controller.ts
  @UseGuards(ThrottlerGuard)
  @Throttle(5, 60) // 5 attempts per minute
  @Public()
  @Post('login')
  @Post('register')
  @Post('oauth/:provider')
  ```

- [ ] **Add cache service infrastructure**:
  ```typescript
  // Create ICacheService interface in domain
  export interface ICacheService {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  }
  
  // Implement InMemoryCacheService in infrastructure
  export class InMemoryCacheService implements ICacheService {
    private cache = new Map<string, { value: any; expiry: number }>();
    // Simple in-memory cache with TTL
  }
  
  // Optional: RedisCacheService for production
  export class RedisCacheService implements ICacheService {
    // Redis-based cache for distributed systems
  }
  ```

- [ ] **Separate JWT service from OAuth concerns**:
  ```typescript
  // Create ITokenService in application layer
  export interface ITokenService {
    generateAccessToken(user: User): Promise<string>;
    verifyAccessToken(token: string): Promise<TokenPayload>;
    // Future: generateRefreshToken, verifyRefreshToken
  }
  
  // Update IOAuthService to remove JWT methods
  export interface IOAuthService {
    // Only OAuth-specific methods, no JWT generation
    validateAndCacheToken(provider: OAuthProviderName, token: string): Promise<OAuthUserInfo>;
  }
  ```

- [ ] **Update all controllers to use `@Public()` decorator**:
  - Remove manual `@UseGuards(JwtAuthGuard)` from protected endpoints
  - Add `@Public()` to: login, register, OAuth endpoints, health checks
  - Verify all other endpoints are protected by default

**Success Criteria**:
- No duplicate guards in codebase
- All endpoints protected by default
- Public endpoints explicitly marked with `@Public()`
- Rate limiting active on auth endpoints
- Cache infrastructure ready for Phase 2
- JWT concerns separated from OAuth
- All existing tests pass
- No breaking changes for existing users

### Phase 1: Domain & Application Refactoring (Days 4-6)

**Objective**: Create unified OAuth architecture that scales to multiple providers

**Deliverables**:
- [ ] Create unified OAuth interfaces in domain:
  ```typescript
  // Generic OAuth provider interface
  interface IOAuthProvider {
    readonly name: OAuthProviderName; // 'google' | 'discord' | 'github'
    validateToken(token: string): Promise<OAuthUserInfo>;
  }
  
  // Generic OAuth user info (provider-agnostic)
  interface OAuthUserInfo {
    providerId: string;      // Google sub, Discord id, etc.
    email: string;
    emailVerified: boolean;
    name?: string;
    picture?: string;
    provider: OAuthProviderName;
  }
  
  // Enhanced OAuth service with common patterns
  interface IOAuthService {
    // Common validation flow with caching
    validateAndCacheToken(
      provider: OAuthProviderName, 
      token: string
    ): Promise<OAuthUserInfo>;
    
    // JWT operations (same for all providers)
    generateAuthToken(user: User): string;
    verifyAuthToken(token: string): Promise<TokenPayload>;
  }
  ```
- [ ] Create `OAuthProviderName` value object ('google' | 'discord' | 'github')
- [ ] Create `DiscordId` value object (mirrors `GoogleId`)
- [ ] Update `User` entity with generic OAuth methods:
  - `createFromOAuth(provider, info)` - replaces provider-specific methods
  - `linkOAuthAccount(provider, providerId)` - generic linking
  - Store provider associations in `_oauthProviders` map
- [ ] Update `IUserRepository` with generic `findByOAuthProvider(provider, id)` method
- [ ] Create generic `OAuthSignInCommand(provider, token)` and `OAuthSignInUseCase`
- [ ] Create generic `LinkOAuthAccountCommand` and `LinkOAuthAccountUseCase`
- [ ] These replace provider-specific use cases with a unified approach

**Success Criteria**:
- Domain supports multiple OAuth providers through generic interfaces
- Application layer uses provider-agnostic commands and use cases
- All existing Google OAuth tests pass with new architecture
- Architecture easily extends to new providers (GitHub, Microsoft, etc.)

### Phase 2: Infrastructure & Universal Caching (Days 7-9)

**Objective**: Implement unified OAuth service with provider-specific adapters and universal caching

**Deliverables**:
- [ ] Create `BaseOAuthService` abstract class with common patterns:
  ```typescript
  export abstract class BaseOAuthService implements IOAuthService {
    constructor(
      protected cache: ICacheService,
      protected logger: ILogger,
      protected config: OAuthProviderConfig
    ) {}
    
    // Template method - same for all providers
    async validateAndCacheToken(
      provider: OAuthProviderName,
      token: string
    ): Promise<OAuthUserInfo> {
      // 1. Check cache first
      const cacheKey = `oauth:${provider}:${this.hashToken(token)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug('OAuth token cache hit', { provider });
        return cached;
      }
      
      // 2. Validate with provider (implemented by subclass)
      const userInfo = await this.validateTokenWithProvider(provider, token);
      
      // 3. Cache the result (TTL from config)
      await this.cache.set(cacheKey, userInfo, this.config.cacheTTL);
      
      // 4. Monitor rate limits (if applicable)
      this.monitorRateLimits(provider);
      
      return userInfo;
    }
    
    // Provider-specific validation (implemented by subclasses)
    protected abstract validateTokenWithProvider(
      provider: OAuthProviderName,
      token: string
    ): Promise<OAuthUserInfo>;
    
    // Common JWT operations
    generateAuthToken(user: User): string { /* ... */ }
    verifyAuthToken(token: string): Promise<TokenPayload> { /* ... */ }
  }
  ```

- [ ] Create `GoogleOAuthProvider` implementing `IOAuthProvider`:
  ```typescript
  export class GoogleOAuthProvider extends BaseOAuthService {
    private client: OAuth2Client;
    
    protected async validateTokenWithProvider(
      provider: 'google',
      idToken: string
    ): Promise<OAuthUserInfo> {
      // Google-specific: offline JWT validation
      const ticket = await this.client.verifyIdToken({ idToken });
      const payload = ticket.getPayload();
      
      return {
        providerId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified,
        name: payload.name,
        picture: payload.picture,
        provider: 'google'
      };
    }
  }
  ```

- [ ] Create `DiscordOAuthProvider` implementing `IOAuthProvider`:
  ```typescript
  export class DiscordOAuthProvider extends BaseOAuthService {
    protected async validateTokenWithProvider(
      provider: 'discord',
      accessToken: string
    ): Promise<OAuthUserInfo> {
      // Discord-specific: API call with rate limit handling
      const response = await this.fetchWithRetry(
        'https://discord.com/api/users/@me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Monitor rate limit headers
      this.handleRateLimitHeaders(response.headers);
      
      const data = await response.json();
      return {
        providerId: data.id,
        email: data.email,
        emailVerified: data.verified,
        name: `${data.username}#${data.discriminator}`,
        picture: data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}` : undefined,
        provider: 'discord'
      };
    }
    
    // Discord-specific rate limit handling
    private async fetchWithRetry(url: string, options: any, attempt = 1): Promise<Response> {
      const response = await fetch(url, options);
      
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
        if (attempt <= 3) {
          await this.sleep(retryAfter * 1000);
          return this.fetchWithRetry(url, options, attempt + 1);
        }
      }
      return response;
    }
  }
  ```

- [ ] Create provider configuration interface:
  ```typescript
  interface OAuthProviderConfig {
    name: OAuthProviderName;
    cacheTTL: number;           // Google: 600, Discord: 300
    rateLimitPerSec?: number;   // Google: null, Discord: 1
    requiresAPICall: boolean;   // Google: false, Discord: true
    retryAttempts: number;      // Google: 1, Discord: 3
  }
  ```

- [ ] Implement unified cache service (Redis primary, in-memory fallback)
- [ ] Update repository to support generic `findByOAuthProvider()`
- [ ] Add provider configurations to environment
- [ ] Update DI container with provider registry pattern
- [ ] Write tests for both providers using same test patterns

**Success Criteria**:
- Both Google and Discord use same caching layer
- Both providers validate tokens successfully
- Rate limit handling works for Discord (graceful for Google)
- Cache hit rates are logged for observability
- Adding new providers (GitHub) requires minimal code
- All infrastructure tests pass for both providers

### Phase 3: Discord OAuth Provider Implementation (Days 10-12)

**Objective**: Add Discord as second OAuth provider using unified architecture

**Deliverables**:
- [ ] Create `DiscordOAuthProvider` extending `BaseOAuthService`:
  ```typescript
  export class DiscordOAuthProvider extends BaseOAuthService {
    protected async validateTokenWithProvider(
      provider: OAuthProviderName,
      token: string
    ): Promise<OAuthUserInfo> {
      // Discord-specific: call /users/@me API
      const response = await this.httpService.get('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return {
        providerId: response.data.id,
        email: response.data.email,
        emailVerified: response.data.verified,
        name: response.data.username,
        picture: response.data.avatar ? 
          `https://cdn.discordapp.com/avatars/${response.data.id}/${response.data.avatar}.png` : 
          null,
        provider: 'discord'
      };
    }
  }
  ```

- [ ] Add Discord retry logic (3 attempts with exponential backoff):
  ```typescript
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    for (let i = 0; i < this.config.retryAttempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === this.config.retryAttempts - 1) throw error;
        await this.sleep(2 ** i * 1000); // 1s, 2s, 4s
      }
    }
  }
  ```

- [ ] Add Discord configuration to environment (CLIENT_ID, CLIENT_SECRET, REDIRECT_URI)
- [ ] Register DiscordOAuthProvider in DI container
- [ ] Update provider registry to include Discord
- [ ] Write Discord-specific integration tests (token validation, error handling, retry logic)
- [ ] Document Discord OAuth setup for developers

**Success Criteria**:
- Discord OAuth flow validates tokens correctly
- Retry logic handles transient failures (50x errors)
- Rate limiting respects Discord's 50 req/sec limit
- Cache reduces redundant Discord API calls
- All Discord tests pass
- Discord authentication works end-to-end
- Swagger documentation is clear and complete

### Phase 4: Backend API & Frontend Integration (Days 13-15)

**Objective**: Expose unified OAuth endpoints and add Discord OAuth to frontend UI

**Backend API Deliverables**:
- [ ] Refactor to generic OAuth endpoints:
  ```typescript
  @Public()
  @Post('oauth/:provider')  // /auth/oauth/google or /auth/oauth/discord
  async oauthSignIn(
    @Param('provider') provider: OAuthProviderName,
    @Body() oauthDto: OAuthSignInDto
  ): Promise<AuthResponseDto> {
    const command = new OAuthSignInCommand(provider, oauthDto.token);
    const result = await this.oauthSignInUseCase.execute(command);
    // ... handle result
  }
  
  @Post('oauth/:provider/link')
  async linkOAuthAccount(
    @Param('provider') provider: OAuthProviderName,
    @Request() req: any,
    @Body() linkDto: LinkOAuthAccountDto
  ): Promise<{ success: boolean; message: string }> {
    const command = new LinkOAuthAccountCommand(
      req.user.userId,
      provider,
      linkDto.token
    );
    // ... handle result
  }
  ```

- [ ] Create generic `OAuthSignInDto` (works for all providers)
- [ ] Add provider validation pipe to ensure valid provider names
- [ ] Update Swagger to document all supported providers dynamically
- [ ] Maintain backward compatibility: `/auth/google` → `/auth/oauth/google` (optional redirect)
- [ ] Write integration tests that validate the pattern works for multiple providers

**Frontend Deliverables**:
- [ ] Add Discord OAuth button to login/register UI
- [ ] Create reusable OAuth provider selection component
- [ ] Implement Discord OAuth popup/redirect flow
- [ ] Add Discord Client ID to frontend environment variables
- [ ] Handle OAuth callback and token exchange
- [ ] Update `AuthContext` to support generic OAuth providers
- [ ] Add visual indicators for OAuth provider used
- [ ] Implement error handling for OAuth flows

**Success Criteria**:
- Single backend endpoint handles all OAuth providers
- Adding new provider doesn't require new endpoints
- API is RESTful and intuitive
- Users can sign in with Discord from frontend
- Users can register new accounts via Discord
- Users can link Discord to existing accounts
- UI clearly shows which OAuth providers are available
- OAuth flow handles errors gracefully
- All integration tests pass

## Top Risks

1. **Discord API Rate Limits - CRITICAL**: Discord has **significantly stricter** rate limits than Google
   - **Discord**: 50 requests/second global + 1 req/sec for token exchange + 5 req/5sec for user info
   - **Google**: 10,000+ requests/day, unlimited server-side token validation
   - **Impact**: High-traffic scenarios could exhaust Discord limits affecting all users
   - **Mitigation**: 
     - Implement Redis/in-memory cache for validated tokens (TTL: 5-10 minutes)
     - Monitor `X-RateLimit-*` headers proactively
     - Implement exponential backoff for 429 errors
     - Rate limit per user to prevent abuse
     - Consider queuing token validation requests
   
2. **OAuth Flow Complexity**: Discord OAuth requires redirect flow, not just token validation like Google
   - **Mitigation**: Use proven OAuth libraries, thoroughly test redirect handling, provide clear error messages
   
3. **Account Collision**: Users with same email on Google and Discord
   - **Mitigation**: Reuse existing collision detection logic from Google implementation, allow account linking

## Success Criteria

**Functional**:
- [ ] Users can sign in with Discord OAuth
- [ ] Users can register via Discord OAuth
- [ ] Users can link Discord to existing accounts
- [ ] Email collision handling works correctly
- [ ] Both Google and Discord OAuth work simultaneously

**Non-Functional**:
- [ ] OAuth flow completes in < 3 seconds
- [ ] No degradation to existing Google OAuth performance
- [ ] All tests pass (unit, integration, e2e)
- [ ] Documentation updated

## Notes

### Unified OAuth Architecture Benefits

**Why cache ALL providers (including Google)?**
1. ✅ **Consistency**: Same code path, same monitoring, same debugging
2. ✅ **Performance**: Even Google benefits from reduced JWT parsing overhead
3. ✅ **Observability**: Unified metrics (cache hit rates, validation times)
4. ✅ **Future-proof**: If Google changes limits, we're already prepared
5. ✅ **Simplicity**: One caching strategy instead of provider-specific logic
6. ✅ **Testing**: Same test patterns for all providers

**What's standardized across providers:**
- Token validation flow (with caching)
- Error handling and retry logic
- Rate limit monitoring (even if thresholds differ)
- Cache key format and TTL configuration
- Logging and observability
- User creation and linking patterns
- API endpoint structure

**What differs per provider:**
- Token validation implementation (JWT vs API call)
- Rate limit thresholds (Google: generous, Discord: strict)
- Retry strategies (Google: 1 attempt, Discord: 3 attempts with backoff)
- Cache TTL (Google: 10min, Discord: 5min)
- Required credentials (Google: client ID, Discord: client ID + secret)

**Adding a new provider (e.g., GitHub):**
```typescript
// 1. Add to domain
type OAuthProviderName = 'google' | 'discord' | 'github';

// 2. Create provider class
export class GitHubOAuthProvider extends BaseOAuthService {
  protected async validateTokenWithProvider(
    provider: 'github',
    accessToken: string
  ): Promise<OAuthUserInfo> {
    // GitHub-specific implementation
  }
}

// 3. Add configuration
{
  name: 'github',
  cacheTTL: 600,
  rateLimitPerSec: 5000, // GitHub is generous
  requiresAPICall: true,
  retryAttempts: 2
}

// 4. Register in DI container
// That's it! No new use cases, commands, or endpoints needed
```

### Environment Variables (Unified Configuration)
```bash
# Backend - OAuth Providers
OAUTH_CACHE_TTL_GOOGLE=600
OAUTH_CACHE_TTL_DISCORD=300
OAUTH_CACHE_TTL_GITHUB=600

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_JWT_SECRET=your_jwt_secret

DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_REDIRECT_URI=http://localhost:3000/auth/oauth/discord/callback

# Frontend
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_DISCORD_CLIENT_ID=your_discord_client_id
VITE_OAUTH_REDIRECT_BASE=http://localhost:5173/auth/oauth
```

### Discord API Endpoints
- Authorization: `https://discord.com/api/oauth2/authorize`
- Token Exchange: `https://discord.com/api/oauth2/token` (Rate: ~1 req/sec per IP)
- User Info: `https://discord.com/api/users/@me` (Rate: 5 req/5sec per token)

### Discord vs Google Rate Limits

| Aspect | Discord | Google |
|--------|---------|--------|
| **Global Limit** | 50 req/sec per app | 10,000+ req/day |
| **Token Validation** | API call required | Offline JWT validation |
| **User Impact** | Shared across all users | Independent |
| **Caching** | **Required** | Optional |
| **Headers** | Yes (X-RateLimit-*) | Rarely used |

**Key Insight**: Discord requires significantly more defensive programming due to strict, shared rate limits.

### Future Considerations
- This pattern can be reused for GitHub, Microsoft, etc.
- Consider extracting common OAuth logic into base classes
- May want to add user profile enrichment (avatar, etc.) from Discord
- Monitor Discord rate limit usage in production metrics
- Consider implementing a request queue for Discord API calls if traffic is high