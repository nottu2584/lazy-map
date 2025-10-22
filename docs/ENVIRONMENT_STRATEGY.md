# Environment File Strategy Analysis

## Current Setup: Single Root .env File

Currently, the project uses a **single .env file** at the repository root that's shared by all applications.

## Strategy Comparison

### Option 1: Single Shared .env File (Current)

**Structure:**
```
lazy-map/
├── .env                 # Shared by all apps
├── .env.example
├── apps/
│   ├── backend/
│   └── frontend/
```

**Pros:**
- ✅ **Simple Management** - One place to update all configs
- ✅ **No Duplication** - Shared values (DB_HOST, JWT_SECRET) defined once
- ✅ **Easy Secrets Rotation** - Update once, affects all apps
- ✅ **Consistent Configuration** - All apps guaranteed to use same values
- ✅ **Simpler CI/CD** - One set of secrets to manage in deployment
- ✅ **Good for Tightly Coupled Apps** - When frontend/backend share many configs

**Cons:**
- ❌ **Namespace Conflicts** - Risk of variable name collisions
- ❌ **Less Isolation** - Apps see each other's configs
- ❌ **Deployment Complexity** - Can't deploy apps with different configs easily
- ❌ **Security Risk** - Frontend devs can see backend secrets
- ❌ **Scaling Issues** - Gets messy with many apps
- ❌ **Mixed Concerns** - Frontend (VITE_*) and backend (DB_*) vars together

### Option 2: Separate .env Files Per App (Recommended)

**Structure:**
```
lazy-map/
├── .env.shared          # Optional: shared configs
├── apps/
│   ├── backend/
│   │   ├── .env
│   │   └── .env.example
│   └── frontend/
│       ├── .env
│       └── .env.example
```

**Pros:**
- ✅ **Better Isolation** - Each app only sees its own configs
- ✅ **Independent Deployment** - Deploy apps with different configs
- ✅ **Better Security** - Frontend can't access backend secrets
- ✅ **Cleaner Organization** - Frontend vars in frontend, backend in backend
- ✅ **Easier Microservices** - Natural progression to service separation
- ✅ **Team Autonomy** - Teams can manage their own configs
- ✅ **Prevents Accidents** - Can't accidentally use wrong app's variables

**Cons:**
- ❌ **Some Duplication** - Shared values need copying (or use .env.shared)
- ❌ **More Files to Manage** - Multiple .env.example files
- ❌ **Synchronization** - Need to keep shared values in sync
- ❌ **Complex Local Setup** - Developers need to configure multiple files

### Option 3: Hybrid Approach (Best Practice)

**Structure:**
```
lazy-map/
├── .env.shared          # Shared configs (optional)
├── apps/
│   ├── backend/
│   │   ├── .env.local  # Local overrides
│   │   ├── .env        # App-specific
│   │   └── .env.example
│   └── frontend/
│       ├── .env.local  # Local overrides
│       ├── .env        # App-specific
│       └── .env.example
```

**Implementation:**
```javascript
// Load in order of precedence
1. .env.local     (highest priority - local overrides)
2. .env           (app-specific configs)
3. ../.env.shared (shared configs)
4. defaults       (fallback values)
```

## Recommended Migration Plan

### Step 1: Create App-Specific .env Files

**Backend .env.example:**
```env
# apps/backend/.env.example
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=lazy_map

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRATION=7d

# Google OAuth (Backend)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Frontend .env.example:**
```env
# apps/frontend/.env.example
NODE_ENV=development
PORT=5173

# API Configuration
VITE_API_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Google OAuth (Frontend)
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Feature Flags
VITE_ENABLE_OAUTH=true
VITE_ENABLE_ANALYTICS=false
```

### Step 2: Update Application Configs

**Backend (NestJS):**
```typescript
// apps/backend/src/config/configuration.ts
import { config } from 'dotenv';
import { resolve } from 'path';

// Load app-specific env first
config({ path: resolve(__dirname, '../../.env') });

// Optionally load shared env
config({ path: resolve(__dirname, '../../../.env.shared') });

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    host: process.env.DB_HOST,
    // ...
  }
});
```

**Frontend (Vite):**
```typescript
// apps/frontend/vite.config.ts
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env files from frontend directory
  const env = loadEnv(mode, process.cwd(), '');

  return {
    // config
  };
});
```

### Step 3: Update Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build: ./apps/backend
    env_file:
      - ./apps/backend/.env
    # ...

  frontend:
    build: ./apps/frontend
    env_file:
      - ./apps/frontend/.env
    # ...
```

### Step 4: Update CI/CD

```yaml
# .github/workflows/deploy.yml
- name: Setup Backend Environment
  run: |
    echo "${{ secrets.BACKEND_ENV }}" > apps/backend/.env

- name: Setup Frontend Environment
  run: |
    echo "${{ secrets.FRONTEND_ENV }}" > apps/frontend/.env
```

## Decision Matrix

| Criteria | Single .env | Separate .env | Hybrid |
|----------|------------|---------------|---------|
| Simplicity | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Security | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Scalability | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Maintainability | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Team Autonomy | ⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Deployment Flexibility | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

## Current Implementation

The Lazy Map project currently uses **Option 2: Separate .env Files**:

1. **Security** - Frontend doesn't have access to database passwords or JWT secrets
2. **Clean Separation** - Backend has DB configs, frontend has Vite configs
3. **Future Growth** - Easy to add more services later
4. **Industry Standard** - Following monorepo best practices
5. **Deployment** - Can deploy frontend to CDN with different configs than backend

### Current Structure
```
apps/
├── backend/
│   ├── .env          # Backend-specific environment variables
│   └── .env.example  # Example configuration for backend
└── frontend/
    ├── .env          # Frontend-specific environment variables
    └── .env.example  # Example configuration for frontend
```

## Special Considerations

### Shared Values
For values needed by both apps (like GOOGLE_CLIENT_ID):
- **Option A**: Duplicate in both .env files (simple but redundant)
- **Option B**: Use .env.shared and load in both apps
- **Option C**: Backend serves config endpoint for frontend

### Environment Precedence
```
1. Environment variables (highest)
2. .env.local (git ignored)
3. .env.[mode] (development/production)
4. .env (base)
5. Hardcoded defaults (lowest)
```

### Security Rules
- ✅ Frontend vars must start with `VITE_` (Vite convention)
- ✅ Never expose backend secrets to frontend
- ✅ Use different JWT secrets per environment
- ✅ Rotate secrets regularly
- ✅ Don't commit .env files (only .env.example)

---

*This separation provides better security, maintainability, and aligns with microservices best practices while still maintaining the benefits of a monorepo.*