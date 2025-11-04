# Complete Oxlint Migration

> Complete the migration from ESLint to oxlint by removing legacy ESLint comments, updating documentation, and adding IDE integration.

## Status & Metadata

- **Status**: Planned
- **Priority**: Low (Code quality improvement)
- **Effort**: 1-2 days
- **Architecture Impact**: None (Tooling only)
- **Owner**: TBD
- **Related**: N/A

## Problem & Goals

### Problem Statement
The repository has already migrated to oxlint for linting (faster, written in Rust), but the migration is incomplete:
1. **Legacy ESLint comments** - Code still has `// eslint-disable-next-line` comments that don't work with oxlint
2. **Documentation mismatch** - README.md still mentions "ESLint + Prettier" instead of "oxlint + Prettier"
3. **No IDE integration** - VS Code doesn't have oxlint extension configured for real-time linting
4. **No CI validation** - Linting not enforced in CI/CD pipeline
5. **Inconsistent configuration** - Multiple oxlint.json files with slight variations

**Current State**:
- ✅ oxlint installed as dev dependency in root package.json (v0.9.1)
- ✅ All packages use `oxlint` in lint scripts
- ✅ oxlint.json configurations exist in apps/backend, apps/frontend, packages/, and domain contexts
- ❌ ESLint comments still in code (3 occurrences in `utils-migration-example.ts`)
- ❌ ESLint mentioned in documentation
- ❌ No VS Code integration
- ❌ No pre-commit hooks
- ❌ No CI enforcement

### Goals
- Remove all legacy ESLint syntax comments
- Update documentation to reflect oxlint usage
- Add VS Code extension for real-time linting
- Consolidate and standardize oxlint configurations
- Add pre-commit hooks for linting
- Add CI/CD linting enforcement
- Document oxlint usage and configuration

### Out of Scope
- Changing linting rules (keep existing rules)
- Adding new linting rules
- Migrating to different linter
- Performance optimization (oxlint is already fast)

## Current State

**Existing Oxlint Configuration**:

**Root** (`package.json`):
```json
{
  "devDependencies": {
    "oxlint": "^1.9.0"
  },
  "scripts": {
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix"
  }
}
```

**Backend** (`apps/backend/oxlint.json`):
```jsonc
{
  "rules": {
    "all": "warn",
    "correctness": "error",
    "suspicious": "error",
    "complexity": "off",
    "no-empty-interface": "off",
    "no-explicit-any": "off",
    "no-console": "off"
  },
  "ignores": ["dist/**", "node_modules/**", "coverage/**", "**/*.test.ts"]
}
```

**Frontend** (`apps/frontend/oxlint.json`):
```jsonc
{
  "parserOptions": { 
    "lang": "typescript",
    "jsx": true
  },
  "rules": {
    "all": "warn",
    "correctness": "error",
    "suspicious": "error",
    "complexity": "off",
    "no-explicit-any": "off",
    "no-console": "warn"
  }
}
```

**Packages** (`packages/oxlint.json`):
```jsonc
{
  "rules": {
    "all": "warn",
    "correctness": "error",
    "suspicious": "error",
    "complexity": "off",
    "no-explicit-any": "off",
    "no-empty-interface": "off"
  }
}
```

**Domain Context Configs**: Multiple `oxlint.json` files in:
- `packages/domain/src/contexts/natural/`
- `packages/domain/src/contexts/artificial/`
- `packages/domain/src/contexts/cultural/`
- `packages/domain/src/contexts/relief/`

**Legacy ESLint References**:
- `packages/domain/src/examples/utils-migration-example.ts` (3× `// eslint-disable-next-line`)
- `README.md` line 242: "ESLint + Prettier"
- eslint types in `pnpm-lock.yaml` (from webpack dependencies, can't remove)

**Pain Points**:
- Developers see ESLint comments that don't work
- Documentation is misleading
- No IDE feedback while coding
- Linting only runs on manual `pnpm lint` command
- Configuration duplication across contexts

## Proposed Solution

Complete the oxlint migration by cleaning up legacy references, adding IDE integration, and enforcing linting in development workflow.

### Key Components

**Phase 1: Code Cleanup** (Day 1, Morning)
- Replace all `// eslint-disable-next-line` with oxlint equivalent syntax
- Remove or update ESLint references in code comments
- Consolidate oxlint configurations

**Phase 2: Configuration Standardization** (Day 1, Afternoon)
- Create shared oxlint config at root
- Remove redundant context-level configs
- Extend shared config in apps/packages

**Phase 3: IDE Integration** (Day 2, Morning)
- Add VS Code oxlint extension
- Create workspace settings for oxlint
- Test real-time linting in VS Code

**Phase 4: Workflow Integration** (Day 2, Afternoon)
- Add pre-commit hooks with husky + lint-staged
- Add CI linting job
- Update documentation

## Architecture Decisions

### Why Oxlint?
- **50-100x faster than ESLint** - Near-instant feedback
- **Zero configuration** - Sensible defaults
- **Rust-based** - Memory-efficient, parallel execution
- **ESLint-compatible rules** - Easy migration path

### Why Complete the Migration?
1. **Developer experience** - IDE integration provides instant feedback
2. **Code quality** - Automated enforcement prevents regressions
3. **CI efficiency** - Fast linting doesn't slow down pipelines
4. **Documentation accuracy** - Avoids confusion for new contributors

### Configuration Strategy
- **Shared base config** at root with common rules
- **App-specific overrides** for backend/frontend differences
- **Remove context configs** (unnecessary granularity)

## Implementation Plan

### Phase 1: Code Cleanup (Day 1, Morning - 2 hours)

**Objective**: Remove legacy ESLint syntax and references

**Deliverables**:
- [ ] Replace ESLint disable comments with oxlint equivalent:
  ```typescript
  // Before
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const example = 123;
  
  // After (oxlint ignore syntax)
  // @ts-expect-error - Example variable for demonstration
  const example = 123;
  
  // Or simply remove if not needed
  ```

- [ ] Search and update all ESLint references in code:
  ```bash
  # Find all eslint comments
  grep -r "eslint-disable" --include="*.ts" --include="*.tsx" --include="*.js"
  
  # Replace with oxlint syntax or remove
  ```

- [ ] Clean up `utils-migration-example.ts`:
  - File location: `packages/domain/src/examples/utils-migration-example.ts`
  - Update 3 occurrences of `// eslint-disable-next-line @typescript-eslint/no-unused-vars`
  - Either remove comments if examples are valid, or use TypeScript ignore syntax

**Success Criteria**:
- Zero occurrences of "eslint-disable" in codebase
- All TypeScript files compile without issues
- Linting passes with `pnpm lint`

### Phase 2: Configuration Standardization (Day 1, Afternoon - 3 hours)

**Objective**: Consolidate oxlint configurations and remove duplication

**Deliverables**:
- [ ] Create shared oxlint config at root (`oxlint.json`):
  ```jsonc
  {
    "linter": "oxlint",
    "exts": ["ts", "tsx", "js", "jsx"],
    "formatter": "stylish",
    "parserOptions": { 
      "lang": "typescript"
    },
    "rules": {
      "all": "warn",
      "correctness": "error",
      "suspicious": "error",
      "complexity": "off",
      "no-explicit-any": "off",
      "no-empty-interface": "off"
    },
    "ignores": [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/*.test.ts",
      "**/*.test.tsx"
    ]
  }
  ```

- [ ] Update backend config to extend base:
  ```jsonc
  // apps/backend/oxlint.json
  {
    "extends": "../../oxlint.json",
    "rules": {
      "no-console": "off"  // Override: console allowed in backend
    }
  }
  ```

- [ ] Update frontend config to extend base:
  ```jsonc
  // apps/frontend/oxlint.json
  {
    "extends": "../../oxlint.json",
    "parserOptions": { 
      "jsx": true  // Override: enable JSX for React
    },
    "rules": {
      "no-console": "warn"  // Override: warn on console in frontend
    }
  }
  ```

- [ ] Simplify packages config to extend base:
  ```jsonc
  // packages/oxlint.json
  {
    "extends": "../oxlint.json"
  }
  ```

- [ ] **Delete redundant context-level configs**:
  - Remove `packages/domain/src/contexts/natural/oxlint.json`
  - Remove `packages/domain/src/contexts/artificial/oxlint.json`
  - Remove `packages/domain/src/contexts/cultural/oxlint.json`
  - Remove `packages/domain/src/contexts/relief/oxlint.json`
  - These inherit from parent `packages/oxlint.json`

- [ ] Update lint scripts to reference correct config:
  ```json
  // packages/application/package.json
  {
    "scripts": {
      "lint": "oxlint src",  // Will find nearest oxlint.json
      "lint:fix": "oxlint src --fix"
    }
  }
  ```

- [ ] Test configuration hierarchy:
  ```bash
  cd apps/backend && pnpm lint
  cd apps/frontend && pnpm lint
  cd packages/domain && pnpm lint
  cd packages/application && pnpm lint
  cd packages/infrastructure && pnpm lint
  ```

**Success Criteria**:
- Single source of truth for base rules
- App-specific overrides work correctly
- All packages lint successfully
- Configuration is DRY (Don't Repeat Yourself)
- Context-level configs removed

### Phase 3: IDE Integration (Day 2, Morning - 2 hours)

**Objective**: Enable real-time linting in VS Code

**Deliverables**:
- [ ] Create `.vscode` directory and settings:
  ```json
  // .vscode/settings.json
  {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit"
    },
    
    // Oxlint configuration
    "oxc.enable": true,
    "oxc.run": "onSave",
    "oxc.configPath": "./oxlint.json",
    
    // Disable ESLint to avoid conflicts
    "eslint.enable": false,
    
    // File associations
    "files.associations": {
      "*.json": "jsonc"
    }
  }
  ```

- [ ] Create VS Code extensions recommendations:
  ```json
  // .vscode/extensions.json
  {
    "recommendations": [
      "oxc-project.oxc-vscode",     // Oxlint/Oxc extension
      "esbenp.prettier-vscode",      // Prettier
      "dbaeumer.vscode-eslint"       // Keep for migration period, will deprecate
    ],
    "unwantedRecommendations": []
  }
  ```

- [ ] Document VS Code setup in README:
  ```markdown
  ### VS Code Setup
  
  1. Install recommended extensions (popup will appear)
  2. Restart VS Code
  3. Oxlint will now provide real-time feedback
  ```

- [ ] Test IDE integration:
  - Open TypeScript file with linting issue
  - Verify squiggly underlines appear
  - Verify "Quick Fix" works for auto-fixable issues
  - Verify problems panel shows oxlint issues

**Success Criteria**:
- VS Code shows oxlint diagnostics in real-time
- Save action auto-fixes issues
- Problems panel displays oxlint warnings/errors
- No ESLint conflicts

### Phase 4: Workflow Integration (Day 2, Afternoon - 3 hours)

**Objective**: Enforce linting in development workflow and CI

**Deliverables**:
- [ ] Install husky and lint-staged:
  ```bash
  pnpm add -D -w husky lint-staged
  pnpm exec husky init
  ```

- [ ] Configure lint-staged:
  ```json
  // package.json
  {
    "lint-staged": {
      "*.{ts,tsx,js,jsx}": [
        "oxlint --fix",
        "prettier --write"
      ]
    }
  }
  ```

- [ ] Create pre-commit hook:
  ```bash
  # .husky/pre-commit
  #!/usr/bin/env sh
  . "$(dirname -- "$0")/_/husky.sh"
  
  pnpm exec lint-staged
  ```

- [ ] Create GitHub Actions workflow:
  ```yaml
  # .github/workflows/lint.yml
  name: Lint
  
  on:
    pull_request:
      branches: [main, develop]
    push:
      branches: [main, develop]
  
  jobs:
    lint:
      runs-on: ubuntu-latest
      
      steps:
        - uses: actions/checkout@v4
        
        - name: Setup pnpm
          uses: pnpm/action-setup@v4
          with:
            version: 10.12.1
        
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: 18
            cache: 'pnpm'
        
        - name: Install dependencies
          run: pnpm install --frozen-lockfile
        
        - name: Run linter
          run: pnpm lint
        
        - name: Check formatting
          run: pnpm format --check
  ```

- [ ] Update README.md with complete tooling section:
  ```markdown
  ## Code Quality
  
  ### Linting
  
  This project uses [oxlint](https://oxc-project.github.io/) for fast, Rust-based linting.
  
  ```bash
  pnpm lint            # Lint all packages
  pnpm lint:fix        # Auto-fix issues
  ```
  
  **Why oxlint?**
  - 50-100x faster than ESLint
  - Zero configuration
  - Written in Rust
  - Near-instant feedback
  
  ### Pre-commit Hooks
  
  Linting runs automatically on staged files before commit using husky + lint-staged.
  
  ### VS Code Integration
  
  Install the recommended Oxc extension for real-time linting feedback.
  ```

- [ ] Update README.md line 242:
  ```markdown
  # Before
  pnpm lint            # ESLint + Prettier
  
  # After
  pnpm lint            # oxlint + Prettier
  ```

- [ ] Create `docs/tooling/linting.md` documentation:
  ```markdown
  # Linting with oxlint
  
  ## Overview
  
  Lazy Map uses oxlint for code linting...
  
  ## Configuration
  
  ## IDE Setup
  
  ## CI/CD Integration
  
  ## Migrating from ESLint
  
  ## Troubleshooting
  ```

**Success Criteria**:
- Pre-commit hooks block commits with linting errors
- CI fails on linting errors
- Documentation accurately reflects oxlint usage
- All developers can set up oxlint easily
- README.md updated with correct information

## Top Risks

1. **Oxlint comment syntax differs from ESLint - LOW**: Oxlint uses different disable syntax
   - **Mitigation**: Document oxlint-specific syntax, provide examples in docs
   
2. **VS Code extension stability - LOW**: Oxc VS Code extension is relatively new
   - **Mitigation**: Fall back to CLI linting if extension has issues, document alternatives

3. **Rule incompatibility - LOW**: Some ESLint rules may not exist in oxlint
   - **Mitigation**: Current config already works, just standardizing it

4. **Team adoption - LOW**: Developers need to install new VS Code extension
   - **Mitigation**: Extensions auto-prompt on workspace open, document setup clearly

## Success Criteria

**Functional**:
- [ ] No ESLint comments in codebase
- [ ] All oxlint configs standardized and consolidated
- [ ] VS Code provides real-time linting feedback
- [ ] Pre-commit hooks enforce linting
- [ ] CI enforces linting on all PRs
- [ ] Documentation updated and accurate

**Non-Functional**:
- [ ] Linting runs in < 1 second (oxlint is fast)
- [ ] Zero false positives from configuration issues
- [ ] Developer experience is smooth and non-disruptive
- [ ] All packages pass linting

## Notes

### Oxlint vs ESLint

| Feature | ESLint | Oxlint |
|---------|--------|--------|
| **Speed** | Baseline (1x) | 50-100x faster |
| **Language** | JavaScript | Rust |
| **Memory** | High | Low |
| **Plugins** | Extensive ecosystem | Limited, growing |
| **Config** | Complex | Simple |
| **Rules** | 300+ rules | Core rules (growing) |

### Oxlint Disable Syntax

Oxlint doesn't use `eslint-disable` comments. Instead:

```typescript
// Disable for entire file
/* oxlint-disable */

// Disable specific rule
/* oxlint-disable-next-line no-unused-vars */

// Or use TypeScript ignore
// @ts-expect-error - Reason for disabling

// For unused vars, often better to prefix with _
const _unusedVar = 123;
```

### Current Configuration Files

**Keep**:
- `oxlint.json` (root) - NEW, shared base config
- `apps/backend/oxlint.json` - Backend-specific overrides
- `apps/frontend/oxlint.json` - Frontend-specific overrides
- `packages/oxlint.json` - Packages base config

**Delete**:
- `packages/domain/src/contexts/*/oxlint.json` - Unnecessary granularity

### Future Enhancements (Out of Scope)

- Custom oxlint rules (requires Rust development)
- Integration with other linters (stylelint for CSS)
- Automated rule migration from ESLint configs
- Performance benchmarking and monitoring

### References

- [Oxlint Documentation](https://oxc-project.github.io/docs/guide/usage/linter.html)
- [Oxlint Rules](https://oxc-project.github.io/docs/guide/usage/linter/rules.html)
- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=oxc-project.oxc-vscode)
- [Why Oxlint?](https://oxc-project.github.io/blog/2023-12-12-announcing-oxlint.html)
