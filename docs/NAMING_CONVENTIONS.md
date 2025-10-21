# File Naming Conventions

This document defines the file naming conventions used throughout the Lazy Map project to ensure consistency and maintainability.

## General Principles

1. **Be Descriptive**: File names should clearly indicate their content and purpose
2. **Be Consistent**: Follow the established patterns for each file type
3. **Use Type Suffixes**: Include type indicators in filenames (e.g., `.dto.ts`, `.controller.ts`)
4. **Context-Based Organization**: Group files by their domain context

## Naming Patterns by File Type

### Domain Layer (`packages/domain`)

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Entities** | `PascalCase.ts` | `MapGrid.ts`, `User.ts`, `Mountain.ts` |
| **Value Objects** | `PascalCase.ts` | `Position.ts`, `Dimensions.ts`, `WaterLevel.ts` |
| **Interfaces** | `I + PascalCase.ts` | `IMapRepository.ts`, `IUserService.ts` |
| **Domain Services** | `I + PascalCase.ts` | `IVegetationService.ts`, `IPasswordService.ts` |
| **Test Files** | `kebab-case.test.ts` | `hydrographic-entities.test.ts`, `value-objects.test.ts` |
| **Index Files** | `index.ts` | Re-exports for cleaner imports |

### Application Layer (`packages/application`)

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Use Cases** | `PascalCase + UseCase.ts` | `GenerateMapUseCase.ts`, `LoginUserUseCase.ts` |
| **Application Services** | `PascalCase + Service.ts` | `MapApplicationService.ts`, `UserAdministrationService.ts` |
| **Ports** | `I + PascalCase + Port.ts` | `IAuthenticationPort.ts`, `INotificationPort.ts` |
| **Guards** | `PascalCase + Guard.ts` | `AdminGuard.ts`, `AuthGuard.ts` |
| **Types** | `PascalCase.ts` | `ApiResponse.ts`, `PaginatedResult.ts` |

### Infrastructure Layer (`packages/infrastructure`)

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Service Implementations** | `PascalCase + Service.ts` | `MapGenerationService.ts`, `BcryptPasswordService.ts` |
| **Adapters** | `PascalCase + Adapter/Service.ts` | `ConsoleNotificationService.ts`, `MapExportService.ts` |
| **Persistence** | `PascalCase + Repository/Persistence.ts` | `PostgresMapRepository.ts`, `InMemoryMapPersistence.ts` |
| **Utilities** | `PascalCase + Service.ts` | `RandomGeneratorService.ts`, `LoggingService.ts` |

### Backend Application (`apps/backend`)

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Controllers** | `kebab-case.controller.ts` | `maps.controller.ts`, `auth.controller.ts`, `admin.controller.ts` |
| **DTOs** | `kebab-case.dto.ts` | `generate-map.dto.ts`, `login-user.dto.ts`, `forest-settings.dto.ts` |
| **Modules** | `kebab-case.module.ts` | `app.module.ts`, `infrastructure.module.ts`, `auth.module.ts` |
| **Guards** | `kebab-case.guard.ts` | `jwt-auth.guard.ts`, `admin.guard.ts` |
| **Strategies** | `kebab-case.strategy.ts` | `jwt.strategy.ts`, `local.strategy.ts` |
| **Configuration** | `kebab-case.config.ts` | `database.config.ts`, `jwt.config.ts` |

### Frontend Application (`apps/frontend`)

| File Type | Pattern | Example |
|-----------|---------|---------|
| **React Components** | `PascalCase.tsx` | `MapViewer.tsx`, `SettingsPanel.tsx` |
| **Hooks** | `use + PascalCase.ts` | `useMapGeneration.ts`, `useAuth.ts` |
| **Utilities** | `camelCase.ts` | `formatters.ts`, `validators.ts` |
| **Types** | `PascalCase.types.ts` | `MapTypes.types.ts`, `UserTypes.types.ts` |
| **Styles** | `PascalCase.module.css` | `MapViewer.module.css`, `App.module.css` |

### Configuration Files

| File Type | Pattern | Example |
|-----------|---------|---------|
| **TypeScript Config** | `tsconfig.json` | Root and package-specific |
| **Build Config** | `[tool].config.ts` | `vite.config.ts`, `vitest.config.ts` |
| **Package Config** | `package.json` | Standard npm/pnpm format |
| **Environment** | `.env.[environment]` | `.env`, `.env.example`, `.env.production` |

## Directory Structure Conventions

### Context-Based Organization
```
contexts/
├── relief/       # Terrain and topography
├── natural/      # Natural features (forests, rivers)
├── artificial/   # Man-made structures
├── cultural/     # Settlements and territories
└── user/         # User management
```

### Layer Separation
```
src/
├── entities/     # Domain entities
├── value-objects/# Immutable value objects
├── services/     # Business logic services
├── repositories/ # Data access interfaces
├── use-cases/    # Application use cases
└── ports/        # Application boundaries
```

## Special Cases

### Test Files
- Place in `__tests__/` directories or alongside the code being tested
- Use descriptive names that indicate what's being tested
- Include `.test.ts` or `.spec.ts` suffix

### Index Files
- Use `index.ts` for re-exports to simplify imports
- Keep them focused on exports only, no logic

### Database Entities
- When using TypeORM or similar: `PascalCase + Entity.ts`
- Example: `MapEntity.ts`, `UserEntity.ts`

## Common Mistakes to Avoid

1. **Mixing Case Styles**: Don't mix PascalCase and kebab-case in the same file type category
2. **Missing Type Suffixes**: Always include `.dto.ts`, `.controller.ts`, etc. for clarity
3. **Generic Names**: Avoid names like `utils.ts`, `helpers.ts` - be specific
4. **Inconsistent Interfaces**: Always prefix interfaces with `I`
5. **Wrong Layer Placement**: Ensure files are in the correct architectural layer

## Migration Guide

When renaming files to match conventions:

1. **Update all imports** in affected files
2. **Run tests** to ensure nothing breaks
3. **Update barrel exports** in `index.ts` files
4. **Check build** with `pnpm build`
5. **Commit changes** with clear message about naming standardization

## Examples of Correct Naming

✅ **Good Examples**:
- `packages/domain/src/contexts/user/entities/User.ts`
- `packages/application/src/contexts/user/use-cases/LoginUserUseCase.ts`
- `apps/backend/src/dto/generate-map.dto.ts`
- `apps/backend/src/auth/auth.controller.ts`

❌ **Bad Examples**:
- `packages/domain/src/contexts/user/entities/user.ts` (should be PascalCase)
- `packages/application/src/contexts/user/use-cases/login.ts` (missing UseCase suffix)
- `apps/backend/src/dto/GenerateMap.dto.ts` (should be kebab-case)
- `apps/backend/src/auth/AuthController.ts` (should be kebab-case.controller.ts)

## Enforcement

These conventions are enforced through:
- Code reviews
- ESLint rules (where applicable)
- Documentation and onboarding
- Consistent examples in the codebase

---

*Last updated: October 2024*
*Maintained as part of Clean Architecture standards*