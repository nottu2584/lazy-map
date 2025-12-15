# Emoji Support in Commit Messages

## Configuration Summary

Emojis are now **allowed** in commit messages while maintaining conventional commits format.

## Constraints Updated

### 1. Commitlint Configuration
**File**: `commitlint.config.mjs`
- `subject-case: 'lower-case'` - Allows non-alphabetic characters (emojis)
- Emojis don't count as uppercase, so they pass validation
- Text portion must still be lowercase

### 2. GitHub Actions
**File**: `.github/workflows/validate-commits.yml`
- PR title pattern: `^(?![A-Z]).+$` - Only blocks uppercase letters
- Emojis are allowed since they're not uppercase letters

### 3. Husky Hook
**File**: `.husky/commit-msg`
- Validates locally before push
- Same rules as commitlint

## Valid Formats

### ✅ Allowed
```bash
feat(backend): ✨ add new feature
feat(backend): add JWT authentication
feat(api): integrate OAuth2 with Discord
fix(frontend): 🐛 resolve map rendering issue
fix(domain): correct MapGrid validation
chore(deps): ⬆️ update dependencies
chore(deps): bump NestJS to v10
docs: 📝 update README
refactor(domain): ♻️ restructure User entity
perf(api): ⚡️ optimize PostgreSQL queries
```

### ❌ Not Allowed
```bash
feat(backend): ✨ Add new feature          # Starts with uppercase
feat(backend): ADD new feature             # Starts with uppercase
Feat(backend): ✨ add new feature          # Type is uppercase
feat(Backend): add new feature             # Scope is uppercase
```

## Recommended Emojis (Gitmoji Style)

| Emoji | Code | Purpose |
|-------|------|---------|
| ✨ | `:sparkles:` | New feature |
| 🐛 | `:bug:` | Bug fix |
| 📝 | `:memo:` | Documentation |
| ♻️ | `:recycle:` | Refactoring |
| ⚡️ | `:zap:` | Performance |
| 🎨 | `:art:` | Code style/structure |
| 🔧 | `:wrench:` | Configuration |
| ⬆️ | `:arrow_up:` | Upgrade dependencies |
| ⬇️ | `:arrow_down:` | Downgrade dependencies |
| 🔒 | `:lock:` | Security fix |
| 🚀 | `:rocket:` | Deployment |
| ✅ | `:white_check_mark:` | Tests |
| 🔥 | `:fire:` | Remove code/files |

## Rules Summary

1. **Emoji placement**: After the colon, before the description (optional)
2. **Subject start**: Must start with lowercase letter or emoji (not uppercase letter)
3. **Uppercase words**: Allowed for acronyms (JWT, API, OAuth), proper nouns (Discord, PostgreSQL), class names (MapGrid)
4. **Optional**: Emojis are optional, traditional format still works
5. **Consistency**: If using emojis, consider using them consistently

## Examples by Type

```bash
# Features
feat(backend): ✨ add discord oauth authentication
feat(frontend): ✨ implement map export feature

# Fixes
fix(api): 🐛 resolve token expiration issue
fix(frontend): 🐛 correct map rendering on mobile

# Documentation
docs: 📝 add oauth setup guide
docs(api): 📝 update swagger documentation

# Refactoring
refactor(domain): ♻️ simplify user validation logic
refactor(infrastructure): ♻️ optimize database queries

# Chores
chore(deps): ⬆️ bump nestjs to v10
chore(ci): 🔧 update github actions workflow

# Performance
perf(backend): ⚡️ cache oauth tokens
perf(frontend): ⚡️ lazy load map components

# Security
fix(auth): 🔒 prevent oauth redirect attacks
chore(deps): 🔒 update vulnerable packages
```

## Testing Locally

Test your commit message before pushing:

```bash
# Test a commit message
echo "feat(backend): ✨ add new feature" | npx commitlint

# Or just commit and let the hook validate
git commit -m "feat(backend): ✨ add new feature"
```

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Gitmoji](https://gitmoji.dev/)
- [Commitlint Rules](https://commitlint.js.org/#/reference-rules)
