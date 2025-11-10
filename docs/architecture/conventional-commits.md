# Conventional Commits Enforcement

This repository enforces [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type (Required)
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `style`: Code style changes (formatting, semicolons, etc)
- `perf`: Performance improvements
- `ci`: CI/CD configuration changes
- `build`: Build system changes
- `revert`: Revert previous commit

### Scope (Optional but Recommended)
- `deps`: Dependency updates
- `backend`: Backend application
- `frontend`: Frontend application
- `application`: Application layer
- `domain`: Domain layer
- `infrastructure`: Infrastructure layer
- `ci`: CI/CD workflows
- `release`: Release-related changes

### Examples

```bash
# Feature with scope
feat(backend): add JWT authentication

# Bug fix without scope
fix: resolve map generation race condition

# Chore with scope (Dependabot style)
chore(deps): bump @nestjs/core from 11.0.1 to 11.0.2

# Documentation
docs: update API documentation

# Refactor
refactor(domain): simplify map entity logic
```

## Enforcement

### GitHub Actions (PR Validation)
- PRs must have conventional commit titles
- All commit messages in PR are validated
- Failed validation blocks merge

### Local Development (Optional)
Install commitlint + husky for pre-commit validation:

```bash
pnpm add -D -w @commitlint/cli @commitlint/config-conventional husky
pnpm exec husky init
echo 'pnpm commitlint --edit $1' > .husky/commit-msg
chmod +x .husky/commit-msg
```

## Why Conventional Commits?

1. **Automatic Changelog**: Generate changelogs from commit history
2. **Semantic Versioning**: Determine version bumps automatically
3. **Better History**: Clear, searchable commit messages
4. **Team Coordination**: Standardized communication
5. **Release Automation**: Enable automated releases

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitlint Documentation](https://commitlint.js.org/)
- [Our Conventions](../architecture/conventions.md)
