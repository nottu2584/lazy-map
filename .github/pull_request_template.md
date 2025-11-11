## PR Title Format

**IMPORTANT:** Your PR title must follow Conventional Commits format:

```
type(scope): description in lowercase
```

### Examples:
```bash
✓ feat(backend): add user authentication service
✓ fix(frontend): resolve map rendering issue
✓ chore(deps): update dependencies
✗ Bugfix/solve issue          # Missing type
✗ Add new feature             # Missing type, uppercase
✗ feat: Add feature           # Uppercase subject
```

### Available Types:
`feat` `fix` `refactor` `docs` `test` `chore` `style` `perf` `ci` `build` `revert`

### Available Scopes (optional):
`backend` `frontend` `application` `domain` `infrastructure` `ci` `deps` `release`

---

## Description

<!-- Brief description of changes -->

## Notes

<!-- Optional: Screenshots, breaking changes, or additional context -->

---

Tests and build validation are handled by CI/CD automatically.
