# Coding Conventions

Consistent code style and naming patterns for the Lazy Map project.

## File Naming

### Domain Layer (`packages/domain`)
- **Entities**: `PascalCase.ts` → `TacticalMapTile.ts`
- **Value Objects**: `PascalCase.ts` → `Position.ts`
- **Interfaces**: `IPascalCase.ts` → `IMapRepository.ts`
- **Tests**: `kebab-case.test.ts` → `map-tile.test.ts`

### Application Layer (`packages/application`)
- **Use Cases**: `PascalCaseUseCase.ts` → `GenerateMapUseCase.ts`
- **Commands**: `PascalCaseCommand.ts` → `GenerateMapCommand.ts`

### Infrastructure Layer (`packages/infrastructure`)
- **Services**: `PascalCase.ts` → `GeologyLayer.ts`
- **Repositories**: `PascalCaseRepository.ts` → `PostgresMapRepository.ts`

### Backend (`apps/backend`)
- **Controllers**: `kebab-case.controller.ts` → `maps.controller.ts`
- **Modules**: `kebab-case.module.ts` → `maps.module.ts`
- **DTOs**: `kebab-case.dto.ts` → `generate-map.dto.ts`

## Architecture Rules

### Single Responsibility
One file = one class/entity. Never multiple classes in one file.

### Clean Architecture
- Domain layer has NO dependencies
- Application depends only on Domain
- Infrastructure depends on Domain + Application
- Dependencies only point inward

### No Backwards Compatibility
Remove legacy code immediately. No deprecated methods.

### Determinism
No `Math.random()`. Use seeded random generators.

## Code Style

### TypeScript
- Use `type` imports for types: `import type { ILogger }`
- Prefer interfaces over types for objects
- Use enums for fixed sets of values
- Explicit return types on public methods

### Naming
- **Classes**: PascalCase
- **Methods/Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Interfaces**: Prefix with `I`

### Testing
- Test files alongside code (`.test.ts`)
- Descriptive test names
- Arrange-Act-Assert pattern
- No mocking in domain tests

## Git Commits

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code restructuring
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

## Documentation

### Code Comments
- Why, not what
- Document complex algorithms
- Include examples for utilities

### File Headers
Skip file headers - let the code speak for itself.

### README Files
Each package should have a README explaining its purpose.