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

# Feature with emoji (optional)
feat(backend): ✨ add JWT authentication

# Bug fix without scope
fix: resolve map generation race condition

# Bug fix with emoji
fix: 🐛 resolve map generation race condition

# Chore with scope (Dependabot style)
chore(deps): bump @nestjs/core from 11.0.1 to 11.0.2

# Documentation
docs: update API documentation

# Refactor
refactor(domain): simplify map entity logic
```

## Enforcement

### Local Git Hooks (Husky)
Commit messages are validated **before** they're created:

- **Pre-commit validation**: Runs commitlint on every commit
- **Hook location**: `.husky/commit-msg`
- **Setup**: Automatic via `pnpm install` (prepare script)
- **Bypass**: Not recommended, but possible with `--no-verify`

### GitHub Actions (PR Validation)
The repository uses automated validation via GitHub Actions:

- **PR Title Validation**: PRs must have conventional commit titles
  - Action: `amannn/action-semantic-pull-request@v6`
  - Validates title format before merge

- **Commit Message Validation**: All commit messages in PR are validated
  - Action: `wagoid/commitlint-github-action@v6`
  - Uses `commitlint.config.mjs` for rules
  - Validates every commit in the PR

- **Failed validation blocks merge** (when branch protection is enabled)

### Branch Protection Rules (Recommended)

To **enforce** these validations, configure branch protection in GitHub:

**Repository Settings → Branches → Add branch protection rule**

```yaml
Branch name pattern: main
Settings:
  ✓ Require status checks to pass before merging
    ✓ Require branches to be up to date before merging
    Status checks that are required:
      ✓ Validate PR title
      ✓ Validate Commit Messages
  ✓ Require pull request reviews before merging
    Required approving reviews: 1
  ✓ Require conversation resolution before merging
  ✓ Do not allow bypassing the above settings
```

**This ensures**:
- No direct pushes to main
- All PRs must pass validation
- PRs with incorrect format cannot be merged
- Dependabot PRs automatically follow the format

### Dependabot Configuration

Dependabot PRs are automatically formatted correctly via `.github/dependabot.yml`:

```yaml
commit-message:
  prefix: "chore(backend)"  # Uses conventional format
  include: "scope"
rebase-strategy: auto        # Auto-updates with main
```

### Local Development (Optional)

Install commitlint + husky for pre-commit validation:

```bash
pnpm add -D -w @commitlint/cli @commitlint/config-conventional husky
pnpm exec husky init
echo 'pnpm commitlint --edit $1' > .husky/commit-msg
chmod +x .husky/commit-msg
```

**Already configured in this project** - just run `pnpm install`.

## Emoji Support

Emojis are **optional** but supported in commit messages:

```bash
feat(backend): ✨ add discord oauth authentication
fix(api): 🐛 resolve token expiration
docs: 📝 update oauth guide
```

**Rules for emojis:**
- Place after the colon, before description
- Text must still be lowercase
- Emojis don't count as uppercase letters
- See [docs/guides/emoji-commits.md](../guides/emoji-commits.md) for full guide

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
