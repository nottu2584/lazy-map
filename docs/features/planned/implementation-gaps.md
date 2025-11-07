# Implementation Gaps

## Status & Metadata
- **Status**: Planned
- **Priority**: Critical (Security vulnerabilities & broken features)
- **Effort**: 6 weeks
- **Architecture Impact**: All Layers
- **Owner**: TBD
- **Last Updated**: November 2024

## Problem & Goals

### Problem Statement
Comprehensive code review revealed critical implementation gaps:

1. **Security Vulnerability** - Mock authentication allows unauthorized access
2. **OAuth Incomplete** - Discord not implemented, Google partially done
3. **Type Incompatibilities** - MapFeature types broken with Building/Road/Bridge
4. **No Map Persistence** - Maps cannot be saved or retrieved
5. **Console.log Pollution** - 14 files with debug statements
6. **Hardcoded Values** - Mock user IDs, fixed dimensions, test data

### Goals
- **Phase 1**: Fix critical security vulnerabilities
- **Phase 2**: Implement map persistence
- **Phase 3**: Complete OAuth implementations
- **Phase 4**: Fix type compatibility issues
- **Phase 5**: Clean up code quality issues
- **Phase 6**: Remove all hardcoded values

## Current State

### Code Review Findings

#### 🔴 Critical Security Issues (1)
1. **Mock Authentication** (`apps/backend/src/modules/auth/auth.guard.ts`)
   ```typescript
   // Current: Returns hardcoded user data
   request.user = {
     id: 'mock-user-id',
     email: 'admin@example.com',
     role: 'ADMIN'
   };
   ```

#### 🟡 Important Feature Gaps (3)
2. **OAuth Not Implemented**
   - Discord OAuth: Complete absence
   - Google OAuth: Backend only, frontend disconnected
   - Login modal has console.log placeholders

3. **Type Compatibility Issues**
   - `GetAllFeaturesUseCase.ts`: TODO comments for artificial features
   - `GetFeatureByIdUseCase.ts`: Building/Road/Bridge incompatible with MapFeature

4. **Map Persistence Missing**
   - `apiService.ts`: Throws "not implemented" errors
   - No database schema for maps
   - getUserMaps returns empty array

#### 🟢 Code Quality Issues (4+)
6. **Console.log Statements** (14 files)
7. **Export Format Issues** (CSV exists but not in enum)
8. **Hardcoded Values** (throughout codebase)
9. **Empty Implementations** (bridge generation, features arrays)

### Statistics
- **TODO Comments**: 3
- **Files with console.log**: 14
- **Placeholder Implementations**: 5+
- **Critical Security Issues**: 1
- **Missing Features**: Multiple
- **Export issues**: Moved to separate planned feature (map-export-formats.md)

## Proposed Solution

### Implementation Phases

#### Phase 1: Security Critical (Week 1) 🔴
**Fix authentication vulnerability immediately**

Tasks:
- [ ] Replace mock auth guard with real JWT validation
- [ ] Implement token verification with jsonwebtoken
- [ ] Add token expiration checks
- [ ] Extract real user from token payload
- [ ] Add refresh token mechanism
- [ ] Implement rate limiting

Code changes:
```typescript
// auth.guard.ts - Replace mock with:
import * as jwt from 'jsonwebtoken';

async canActivate(context: ExecutionContext): Promise<boolean> {
  const request = context.switchToHttp().getRequest();
  const token = this.extractToken(request);

  if (!token) {
    throw new UnauthorizedException('Token required');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    request.user = await this.userService.findById(payload.sub);
    return true;
  } catch (error) {
    throw new UnauthorizedException('Invalid token');
  }
}
```

#### Phase 2: Map Persistence (Week 2) 🔴
**Implement database storage for generated maps**

Tasks:
- [ ] Create database schema
- [ ] Implement save endpoint
- [ ] Implement retrieval endpoints
- [ ] Add user-map associations

```sql
CREATE TABLE maps (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255),
  seed VARCHAR(255),
  width INTEGER,
  height INTEGER,
  context JSONB,
  tiles JSONB,
  created_at TIMESTAMP
);
```

#### Phase 3: OAuth Integration (Week 3) 🟡
**Complete OAuth implementations**

Discord OAuth:
- [ ] Install passport-discord
- [ ] Create Discord strategy
- [ ] Add redirect handlers
- [ ] Implement token exchange

Google OAuth:
- [ ] Complete frontend integration
- [ ] Add popup/redirect flow
- [ ] Handle tokens properly

```typescript
// discord.strategy.ts
import { Strategy as DiscordStrategy } from 'passport-discord';

@Injectable()
export class DiscordOAuthStrategy extends PassportStrategy(DiscordStrategy) {
  constructor() {
    super({
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ['identify', 'email']
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return this.authService.findOrCreateUser({
      provider: 'discord',
      providerId: profile.id,
      email: profile.email,
      username: profile.username
    });
  }
}
```

#### Phase 4: Type Compatibility (Week 4) 🟡
**Fix MapFeature type issues**

- [ ] Create proper type mappings
- [ ] Implement adapter pattern
- [ ] Add type guards
- [ ] Fix use case implementations

```typescript
// feature.adapter.ts
export class FeatureAdapter {
  static buildingToMapFeature(building: Building): MapFeature {
    return {
      id: building.id,
      type: 'building',
      position: building.position,
      properties: {
        buildingType: building.type,
        floors: building.floors,
        condition: building.condition
      }
    };
  }

  static roadToMapFeature(road: Road): MapFeature {
    // Similar adapter
  }
}
```

#### Phase 5: Code Quality (Week 5) 🟢
**Clean up technical debt**

- [ ] Replace all console.log with proper logger
- [ ] Implement remaining export formats
- [ ] Remove empty placeholders
- [ ] Add proper error handling

```typescript
// Replace console.log with:
@Inject(LOGGER_TOKEN) private readonly logger: ILogger;

this.logger.info('OAuth login attempt', { provider });
```

#### Phase 6: Configuration (Week 6) 🟢
**Remove hardcoded values**

- [ ] Create configuration modules
- [ ] Add environment variables
- [ ] Validate configuration
- [ ] Update documentation

```typescript
// config/auth.config.ts
export const authConfig = registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiration: process.env.JWT_EXPIRATION || '7d',
  refreshSecret: process.env.REFRESH_SECRET,
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET
    }
  }
}));
```

## Technical Requirements

### Dependencies to Add
```json
{
  "jsonwebtoken": "^9.0.2",
  "sharp": "^0.33.0",
  "passport-discord": "^0.1.4",
  "pdfkit": "^0.14.0",
  "winston": "^3.11.0",
  "@nestjs/jwt": "^10.2.0"
}
```

### Environment Variables
```env
# Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d
REFRESH_SECRET=your-refresh-secret

# OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
OAUTH_REDIRECT_URL=http://localhost:3030/auth/callback

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lazymap
DB_USER=postgres
DB_PASSWORD=
```

## Testing Requirements

### Unit Tests
- [ ] JWT validation logic
- [ ] OAuth strategies
- [ ] Export service methods
- [ ] Type adapters
- [ ] Configuration validation

### Integration Tests
- [ ] Full auth flow
- [ ] OAuth login flow
- [ ] Map persistence
- [ ] Export functionality
- [ ] Protected endpoints

### Security Tests
- [ ] Invalid token rejection
- [ ] Expired token handling
- [ ] Rate limiting
- [ ] SQL injection prevention
- [ ] XSS prevention

## Risk Mitigation

1. **Security Breach Risk** (CRITICAL)
   - Current: Mock auth exposes all endpoints
   - Mitigation: Fix immediately in Phase 1
   - Fallback: Disable API until fixed

2. **Data Loss Risk** (HIGH)
   - Current: No persistence
   - Mitigation: Implement in Phase 2
   - Fallback: Export to JSON

3. **Type Errors** (MEDIUM)
   - Current: Features broken
   - Mitigation: Adapter pattern
   - Fallback: Temporary type assertions

## Success Metrics

- [ ] 0 security vulnerabilities
- [ ] 0 console.log in production
- [ ] 100% TODO comments resolved
- [ ] All exports functional
- [ ] OAuth providers working
- [ ] Maps persistable
- [ ] Type errors resolved
- [ ] 80%+ test coverage

## Timeline

| Week | Phase | Priority | Deliverables |
|------|-------|----------|--------------|
| 1 | Security | 🔴 Critical | JWT auth, token validation |
| 2 | Persistence | 🔴 Critical | Map database storage |
| 3 | OAuth | 🟡 High | Discord & Google OAuth |
| 4 | Types | 🟡 High | Fix MapFeature compatibility |
| 5 | Quality | 🟢 Medium | Remove console.log, clean code |
| 6 | Config | 🟢 Low | Environment variables |

## Notes

- Security fixes must be deployed first
- Each phase independently deployable
- Maintain backward compatibility
- Document all breaking changes
- Consider feature flags for gradual rollout

---