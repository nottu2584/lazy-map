# Backend Authentication Architecture Analysis

**Date**: November 4, 2025  
**Scope**: NestJS Auth Module, OAuth Providers, General Auth Setup

## Executive Summary

✅ **Overall Assessment**: The current authentication setup is **solid** and follows most NestJS best practices, but has **room for improvement** in consistency, security features, and OAuth provider architecture.

**Rating**: 7/10 (Good foundation, needs standardization and modern features)

---

## 1. NestJS Best Practices Compliance

### ✅ **What's Done Well**

#### Module Organization
```typescript
@Module({
  imports: [PassportModule, JwtModule, ApplicationModule, InfrastructureModule],
  controllers: [AuthController],
  providers: [JwtStrategy, JwtAuthGuard, AdminGuard, AuthGuard],
  exports: [JwtStrategy, JwtAuthGuard, AdminGuard, AuthGuard, PassportModule]
})
export class AuthModule {}
```
✅ **Follows NestJS module pattern** - Proper imports, providers, exports  
✅ **Uses Passport.js** - Industry standard for Node.js authentication  
✅ **JWT Module async registration** - Config-driven with ConfigService  
✅ **Clean separation** - Auth module is isolated and reusable

#### JWT Strategy Implementation
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }
}
```
✅ **Standard Passport JWT strategy**  
✅ **Config-driven secrets**  
✅ **Proper bearer token extraction**  
✅ **Validates expiration**

#### Guards Pattern
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```
✅ **Extends Passport AuthGuard** - Standard NestJS pattern  
✅ **Composable guards** - Can combine with other guards  
✅ **Declarative usage** - `@UseGuards(JwtAuthGuard)`

### ⚠️ **Issues & Anti-Patterns**

#### 1. Duplicate/Confusing Guards
```typescript
// TWO different guards with similar purposes:
export class AuthGuard implements CanActivate { ... }  // Mock implementation
export class JwtAuthGuard extends AuthGuard('jwt') {}  // Real Passport guard
```
❌ **Problem**: `AuthGuard` is a placeholder with mock logic  
❌ **Problem**: Name collision with Passport's `AuthGuard`  
❌ **Problem**: Confusing which guard to use

**Recommendation**: Remove custom `AuthGuard`, use only `JwtAuthGuard`

#### 2. No Global Authentication Strategy
```typescript
// Currently: Every endpoint must explicitly use @UseGuards(JwtAuthGuard)
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile() { ... }
```
❌ **Not following modern NestJS practice** - Should use global guard with `@Public()` decorator  
❌ **Repetitive** - Easy to forget guard on new endpoints  
❌ **Security risk** - Endpoints are public by default

**NestJS Best Practice**:
```typescript
// In main.ts or app module
app.useGlobalGuards(new JwtAuthGuard());

// Then make specific endpoints public
@Public()
@Post('login')
async login() { ... }
```

#### 3. No Refresh Token Implementation
❌ **Missing refresh tokens** - Only access tokens (7-day expiration)  
❌ **Security concern** - Long-lived tokens can't be revoked  
❌ **User experience** - Users must re-login after 7 days

**Modern practice**: Short-lived access tokens (15 min) + long-lived refresh tokens (30 days)

#### 4. No Rate Limiting on Auth Endpoints
❌ **No rate limiting** on `/auth/login`, `/auth/register`  
❌ **Vulnerable to brute force attacks**  
❌ **Missing Throttler module**

**Should have**:
```typescript
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 attempts per 60 seconds
@Post('login')
```

---

## 2. OAuth Provider Architecture

### Current Implementation

```typescript
// Infrastructure Module
{
  provide: 'IOAuthService',
  useFactory: (configService: ConfigService) => {
    return createGoogleOAuthService(clientId, jwtSecret, logger);
  }
}
```

### ⚠️ Issues

#### 1. Tight Coupling to Google
❌ **`IOAuthService` has Google-specific method**: `validateGoogleToken()`  
❌ **Single provider assumption** - Can't support Discord, GitHub simultaneously  
❌ **No strategy pattern** - Adding providers requires interface changes

#### 2. Mixed Responsibilities
```typescript
interface IOAuthService {
  validateGoogleToken(idToken: string): Promise<GoogleUserInfo>;  // OAuth-specific
  generateAuthToken(user: User): string;  // JWT generation (not OAuth)
  verifyAuthToken(token: string): Promise<TokenPayload>;  // JWT verification
}
```
❌ **Violates Single Responsibility Principle** - OAuth validation + JWT generation  
❌ **Should be separated** - OAuth providers vs JWT service

#### 3. No Provider Registry Pattern
❌ **Can't dynamically select provider**  
❌ **No factory for multiple providers**  
❌ **Hard to test different providers**

**Should be**:
```typescript
interface IOAuthProviderRegistry {
  getProvider(name: OAuthProviderName): IOAuthProvider;
  registerProvider(provider: IOAuthProvider): void;
}
```

---

## 3. General Auth Setup Evaluation

### For the Application's Use Case

**Context**: Lazy Map is a tactical map generator with:
- User accounts for saving maps
- OAuth sign-in (Google, potentially Discord)
- Admin features
- Map history per user

### ✅ **What's Appropriate**

1. ✅ **JWT-based auth** - Good for stateless API
2. ✅ **OAuth integration** - Lowers barrier to entry (no passwords to manage)
3. ✅ **Role-based access** - Admin guards properly check permissions
4. ✅ **Clean Architecture compliance** - Domain/Application/Infrastructure separation
5. ✅ **7-day token expiration** - Reasonable for a tool (not sensitive data)

### ⚠️ **What's Missing/Could Be Better**

#### 1. Session Management
❌ **No token revocation** - Can't log users out server-side  
❌ **No session storage** - Can't see active users  
❌ **No "remember me"** - Just one 7-day token

**For this app**: Probably not critical, but nice to have

#### 2. Email Verification
❌ **No email verification** for local registration  
❌ **OAuth providers are verified** (Google confirms email)  
❌ **Local accounts aren't** - Could register with fake email

**For this app**: Consider adding if spam becomes an issue

#### 3. Password Reset
❌ **No password reset flow**  
❌ **Users with local accounts can't recover** access

**For this app**: Should add - this is a standard expectation

#### 4. Multi-Factor Authentication (MFA)
❌ **No 2FA/MFA support**

**For this app**: Probably overkill unless storing sensitive data

#### 5. Account Linking
✅ **Has linking** - Can link Google to existing account  
⚠️ **Will need standardization** when adding Discord

---

## Comparison with Industry Standards

### For a Map Generation Tool (Similar to Figma/Excalidraw)

| Feature | Lazy Map | Industry Standard | Priority |
|---------|----------|------------------|----------|
| **JWT Auth** | ✅ Has it | ✅ Expected | - |
| **OAuth (Google)** | ✅ Has it | ✅ Expected | - |
| **OAuth (Multiple)** | ❌ Only Google | ✅ 2-3 providers | High |
| **Refresh Tokens** | ❌ Missing | ✅ Expected | Medium |
| **Rate Limiting** | ❌ Missing | ✅ Required | High |
| **Global Guards** | ❌ Manual | ✅ Best practice | Medium |
| **Email Verification** | ❌ Missing | ⚠️ Optional | Low |
| **Password Reset** | ❌ Missing | ✅ Expected | Medium |
| **Session Management** | ❌ Missing | ⚠️ Optional | Low |
| **2FA/MFA** | ❌ Missing | ⚠️ Nice to have | Low |

---

## Recommendations

### 🔴 **High Priority (Security & Standards)**

1. **Remove duplicate `AuthGuard`** - Use only `JwtAuthGuard`
2. **Implement global authentication** - All endpoints auth by default, use `@Public()` decorator
3. **Add rate limiting** - Protect login/register endpoints (use `@nestjs/throttler`)
4. **Standardize OAuth architecture** - Prepare for multiple providers (as per Discord OAuth plan)

### 🟡 **Medium Priority (Better UX)**

5. **Add refresh tokens** - Short access tokens + refresh flow
6. **Add password reset** - Email-based recovery for local accounts
7. **Separate JWT service** - Move JWT operations out of OAuth service

### 🟢 **Low Priority (Nice to Have)**

8. **Add email verification** - For local accounts
9. **Session management** - Track active sessions
10. **Audit logging** - Log auth events for security

---

## Proposed Refactoring Plan

### Phase 1: Clean Up Current Issues (1-2 days)
- Remove duplicate `AuthGuard`
- Implement global `JwtAuthGuard` with `@Public()` decorator
- Add `@nestjs/throttler` for rate limiting
- Fix guard naming and usage

### Phase 2: OAuth Standardization (Part of Discord OAuth feature)
- Implement unified OAuth architecture (as documented in Discord plan)
- Separate `JwtAuthenticationService` from OAuth providers
- Create `OAuthProviderRegistry`

### Phase 3: Security Improvements (1 week)
- Implement refresh token flow
- Add password reset functionality
- Add email verification

### Phase 4: Optional Enhancements (Future)
- Session management
- Audit logging
- 2FA/MFA support

---

## Code Examples

### 1. Global Auth Guard (Best Practice)

```typescript
// main.ts
const app = await NestFactory.create(AppModule);
const reflector = app.get(Reflector);
app.useGlobalGuards(new JwtAuthGuard(reflector));

// auth.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }
    
    return super.canActivate(context);
  }
}

// Usage
@Public()
@Post('login')
async login() { ... }

// Protected by default - no decorator needed
@Get('profile')
async getProfile() { ... }
```

### 2. Rate Limiting

```typescript
// Install: npm install @nestjs/throttler

// app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})

// auth.controller.ts
@UseGuards(ThrottlerGuard)
@Throttle(5, 60) // 5 requests per 60 seconds
@Post('login')
async login(@Body() loginDto: LoginUserDto) { ... }
```

### 3. Separated JWT Service

```typescript
// Don't mix OAuth and JWT concerns
interface ITokenService {
  generateAccessToken(user: User): Promise<string>;
  generateRefreshToken(user: User): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
  verifyRefreshToken(token: string): Promise<TokenPayload>;
}

interface IOAuthProvider {
  readonly name: OAuthProviderName;
  validateToken(token: string): Promise<OAuthUserInfo>;
}
```

---

## Conclusion

**Overall**: The auth setup is **functional and follows basic NestJS patterns**, but **needs modernization** for:
- Better security (rate limiting, global guards)
- OAuth provider scalability (Discord integration will require refactoring)
- User experience (refresh tokens, password reset)

**Next Steps**: 
1. Address high-priority security issues (duplicate guards, rate limiting)
2. Implement unified OAuth architecture as part of Discord integration
3. Consider refresh tokens and password reset for better UX

The foundation is solid, but treating auth as a first-class feature with proper patterns will make the codebase more maintainable and secure as it scales.