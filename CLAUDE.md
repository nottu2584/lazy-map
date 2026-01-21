# CLAUDE.md

Agent guide for Lazy Map - tactical battlemap generator for tabletop RPGs.

## Core Principles

**Architecture**: Clean Architecture + DDD
**Determinism**: Same seed → identical map (ALWAYS)
**Scale**: 50-100 tiles @ 5ft/tile (tactical combat)

## Project Structure

```
lazy-map/
├── apps/
│   ├── backend/         # NestJS delivery layer (NO business logic)
│   └── frontend/        # React + Konva viewer
└── packages/            # Core business logic
    ├── domain/          # Pure entities (NO dependencies)
    ├── application/     # Use cases (depends: domain)
    └── infrastructure/  # External implementations (depends: domain + application)
```

## Critical Rules

### 1. Clean Architecture
- **Domain → Nothing** (pure, deterministic)
- **Application → Domain only** (orchestration)
- **Infrastructure → Domain + Application** (implementations)
- **Controllers → Use Cases** (NEVER services directly)

### 2. Single Responsibility
- One file = One class/entity/use case
- Split files > 100 lines with multiple concepts
- No backwards compatibility or @deprecated code

### 3. Determinism
- No `Math.random()` in domain
- Use seeded random from `Seed` value objects
- All generation must be reproducible

### 4. Error & Logging
```typescript
// Errors: Use DomainError hierarchy
throw new ValidationError(
  'ERROR_CODE',
  'Technical message',
  'User message',
  { component: 'Name', operation: 'method' },
  ['Fix suggestion']
);

// Logging: Use ILogger interface
this.logger?.debug('Message', { metadata: { data } });
```

### 5. Naming Consistency
- Be consistent with pluralization
- `SpaceRequirements` (contains multiple requirements)
- `RoomRequirements` (specification for multiple rooms)
- Use descriptive, domain-specific names

### 6. File Organization & Imports
**Critical Rules**:
- **Every folder MUST have an `index.ts`** that exports its contents
- **Always import from folder indexes**, never direct file imports
- **No `/dist` paths** in imports

**Example Structure**:
```
contexts/
├── artificial/
│   ├── index.ts          # exports * from './entities', './services', etc.
│   ├── entities/
│   │   ├── index.ts      # exports * from './Building', './Road', etc.
│   │   ├── Building.ts
│   │   └── Road.ts
│   └── services/
│       ├── index.ts      # exports interface definitions
│       └── IBuildingGenerationService.ts
```

✅ **Correct Import**:
```typescript
import { Building, IBuildingGenerationService } from '@lazy-map/domain';
```

❌ **Wrong Import**:
```typescript
import { Building } from '@lazy-map/domain/contexts/artificial/entities/Building';
```

## Domain Contexts

- `relief/` - Terrain, elevation, geology
- `natural/` - Vegetation, water features
- `artificial/` - Buildings, roads, structures
- `cultural/` - Settlements, territories
- `map/` - Aggregate root

## Development Workflow

1. **Domain First**: Define entities/value objects
2. **Use Cases**: Create application orchestration
3. **Infrastructure**: Implement domain interfaces
4. **Controllers**: Wire to use cases with class-based @Inject
5. **Documentation**: Update /docs when changing features
6. **Testing**: Ensure deterministic generation

## Commit & PR Conventions

**CRITICAL**: Always follow Conventional Commits format with strict validation.

**Format**: `type(scope): subject`
- Subject must **start with lowercase**, but may contain capitals for proper nouns and acronyms (Discord, OAuth, JWT, API, etc.)
- No period at end of subject
- **Max 100 characters** for entire header (type + scope + subject)
- Body lines can be any length (URLs, links are allowed)

**Valid Types**:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
- `style` - Code style (formatting)
- `perf` - Performance improvements
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Revert previous commit

**Valid Scopes** (MUST use one of these):
- `application` - Application layer
- `backend` - Backend app
- `ci` - CI/CD
- `deps` - Dependency updates
- `docs` - Documentation
- `domain` - Domain layer
- `frontend` - Frontend app
- `infrastructure` - Infrastructure layer
- `release` - Release-related
- `security` - Security fixes

**Examples**:
```
✅ feat(domain): add Discord OAuth support to user entity
✅ fix(backend): resolve JWT authentication token validation
✅ refactor(infrastructure): remove console.log statements
✅ docs: add commit conventions reference to CLAUDE.md

❌ feat(logging): add new logger (invalid scope)
❌ Feat(domain): Add Plant Species (uppercase start - must start lowercase)
❌ fix(backend): This line starts with capital letter
❌ fix(backend): this line exceeds the 100 character limit for the entire header length
```

**VS Code Setup**:
The repository includes VS Code configuration for easier commit creation:
- Extension: `vivaxy.vscode-conventional-commits` (auto-recommended)
- Git commit template: `.gitmessage` (shows valid types/scopes in commit editor)
- GitHub Copilot: AI-powered commit generation with custom instructions
- Settings in `.vscode/settings.json` match `commitlint.config.mjs` exactly
- Use CMD+Shift+P → "Conventional Commits" to create commits with guided UI
- Click sparkle icon (⚡) in Source Control for AI-generated commit messages
- See [/docs/guides/commit-message-generation.md](../docs/guides/commit-message-generation.md) for details

## Dependency Injection Pattern

**ALWAYS use class-based injection in NestJS controllers/services:**

✅ **Correct - Class-based injection**:
```typescript
constructor(
  @Inject(GenerateTacticalMapUseCase)
  private readonly useCase: GenerateTacticalMapUseCase,
  @Inject(LOGGER_TOKEN) private readonly logger: ILogger
) {}
```

❌ **Wrong - String token injection**:
```typescript
constructor(
  @Inject('GenerateTacticalMapUseCase')  // Don't use string tokens!
  private readonly useCase: GenerateTacticalMapUseCase
) {}
```

**Why class-based?**
- Type-safe with IDE support
- Simpler and cleaner code
- No string token maintenance
- Standard NestJS pattern

## Common Patterns

### Value Object
```typescript
export class Position {
  private constructor(private readonly x: number, private readonly y: number) {
    Object.freeze(this);
  }

  static create(x: number, y: number): Position {
    // Validation
    if (x < 0) throw new ValidationError(/*...*/);
    return new Position(x, y);
  }

  // Getters only (immutable)
  getX(): number { return this.x; }
}
```

### Use Case
```typescript
@Injectable()
export class GenerateBuildingUseCase {
  constructor(
    @Inject('IBuildingGenerationService')
    private readonly generator: IBuildingGenerationService
  ) {}

  async execute(command: Command): Promise<Result> {
    // Orchestrate domain logic
  }
}
```

## Map Generation Layers

0. **Geology** - Bedrock, soil (foundation)
1. **Topography** - Elevation, slopes
2. **Hydrology** - Water flow, springs
3. **Vegetation** - Plants based on moisture
4. **Structures** - Buildings with interiors
5. **Features** - Tactical elements

Each layer depends on previous, creating realistic terrain.

## Quick Reference

- **Docs**: `/docs` - All documentation
- **Commands**: `pnpm dev`, `pnpm test`, `pnpm build`
- **Ports**: Backend 3000, Frontend 5173
- **Seeds**: Strings ("goblin-ambush") or numbers (12345)

## Maintenance

- Update `/docs` when changing features
- Remove legacy code immediately
- Keep files focused and small
- Ensure all generation is deterministic
- Use domain errors with recovery suggestions

---

*Agent: Prioritize determinism, clean architecture, and single responsibility. When uncertain, check existing patterns in codebase.*