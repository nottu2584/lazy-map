# @lazy-map/api-contracts

Auto-generated API types and contracts from OpenAPI specification.

## Setup & Usage

### First-time setup

1. **Start the backend** (generates `openapi.json`):
   ```bash
   pnpm dev:backend
   ```

2. **Generate types** from the OpenAPI spec:
   ```bash
   pnpm generate
   ```

3. **Use in your app**:
   ```typescript
   import type { components, paths } from '@lazy-map/api-contracts';

   type GenerateMapRequest = components['schemas']['GenerateMapDto'];
   type GenerateMapResponse = paths['/api/maps/generate']['post']['responses']['201']['content']['application/json'];
   ```

### Development Workflow

**When backend API changes:**
1. Backend runs → `openapi.json` updates automatically
2. Run `pnpm generate` to regenerate types
3. Frontend gets new types instantly

**Optional: Watch mode**
```bash
# Terminal 1: Backend
pnpm dev:backend

# Terminal 2: Auto-regenerate on changes
pnpm generate:watch
```

## Package Structure

```
@lazy-map/api-contracts/
├── src/
│   ├── generated/
│   │   └── types.ts        # AUTO-GENERATED - Don't edit manually
│   └── index.ts            # Re-exports generated types
└── package.json
```

## Generated Type Examples

### Request Types
```typescript
import type { components } from '@lazy-map/api-contracts';

type GenerateMapRequest = components['schemas']['GenerateMapDto'];
type SaveMapRequest = components['schemas']['SaveMapDto'];
```

### Response Types
```typescript
import type { paths } from '@lazy-map/api-contracts';

type GenerateMapResponse =
  paths['/api/maps/generate']['post']['responses']['201']['content']['application/json'];
```

### Path Parameters
```typescript
type GetMapParams = paths['/api/maps/{id}']['get']['parameters']['path'];
```

## Benefits

✅ **Zero duplication** - Backend is single source of truth
✅ **Type safety** - Compile errors if API changes
✅ **Autocomplete** - IDE suggestions for all endpoints
✅ **Always in sync** - Generation ensures frontend matches backend
✅ **Reusable** - Any app can import these types (web, mobile, admin)

## Scripts

- `pnpm generate` (local) - Generate types from `apps/backend/openapi.json`
- `pnpm generate` (root) - Shortcut to run generation
- `pnpm generate:watch` (root) - Watch mode for auto-regeneration
