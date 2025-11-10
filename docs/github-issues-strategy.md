# GitHub Issues Strategy for Lazy Map

## Overview
This document outlines how to use GitHub Issues for tracking features, bugs, and tasks in the Lazy Map project.

## Label Structure

### Layer Labels (Architecture)
Use these to indicate which architectural layer is affected:
- `domain-layer` - Core domain logic changes
- `application-layer` - Use cases and business logic
- `infrastructure-layer` - External integrations, adapters
- `backend` - Backend application changes
- `frontend` - Frontend application changes

### Feature Area Labels
Use these to categorize the feature domain:
- `map-generation` - Map generation algorithms and features
- `persistence` - Data storage and retrieval
- `oauth` - Authentication and OAuth integrations
- `export` - Export functionality (PDF, PNG, JSON, etc.)
- `security` - Security-related issues and improvements

### Issue Type Labels
- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Documentation improvements
- `planned` - Features from docs/features/planned

### Priority Labels (use in title prefix)
Since we don't have priority labels, use emoji prefixes in titles:
- 🔴 `[CRITICAL]` - Security vulnerabilities, data loss risks
- 🟡 `[HIGH]` - Broken features, important functionality
- 🟢 `[MEDIUM]` - Quality improvements, nice-to-have features
- ⚪ `[LOW]` - Minor improvements, tech debt

### Workflow Labels
- `help wanted` - Community contributions welcome
- `good first issue` - Good for newcomers
- `wontfix` - Will not be implemented
- `duplicate` - Duplicate of another issue
- `invalid` - Not a valid issue

## Issue Templates

### Feature Issue Structure
```markdown
## Priority
[CRITICAL/HIGH/MEDIUM/LOW]

## Problem Statement
What problem does this solve?

## Proposed Solution
High-level approach

## Implementation Tasks
- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Affected Layers
- [ ] Domain
- [ ] Application
- [ ] Infrastructure
- [ ] Backend
- [ ] Frontend

## Testing Requirements
How will this be tested?

## Documentation
Link to docs/features/planned/[feature].md
```

### Bug Report Structure
```markdown
## Severity
🔴 Critical / 🟡 High / 🟢 Medium / ⚪ Low

## Description
Clear description of the bug

## Steps to Reproduce
1. Step 1
2. Step 2
3. See error

## Expected vs Actual
- Expected: [what should happen]
- Actual: [what happens]

## Affected Components
- File: [path/to/file.ts]
- Layer: [domain/application/infrastructure]

## Error Logs
```
[paste logs here]
```
```

## Labeling Best Practices

### For New Features
Always include:
1. `enhancement` or `bug` (type)
2. Architectural layer labels (backend, frontend, domain-layer, etc.)
3. Feature area label (map-generation, persistence, etc.)
4. `planned` if from documentation

Example: `enhancement, backend, application-layer, persistence, planned`

### For Bugs
Always include:
1. `bug`
2. `security` if security-related
3. Affected layer labels
4. Feature area if applicable

Example: `bug, security, backend, oauth`

### For Documentation
Always include:
1. `documentation`
2. Related feature area labels

Example: `documentation, map-generation`

## Migration from Docs to Issues

### Current Planned Features
From `docs/features/planned/`:

1. **implementation-gaps.md** → Multiple issues:
   - 🔴 Security vulnerability (FIXED)
   - 🔴 Map persistence (IMPLEMENTED)
   - 🟡 OAuth completion
   - 🟡 Type compatibility
   - 🟢 Code quality cleanup

2. **discord-oauth-integration.md** → Single issue
   - Labels: `enhancement, oauth, backend, planned`

3. **map-export-formats.md** → Single issue
   - Labels: `enhancement, export, backend, planned`

4. **bridge-generation-system.md** → Single issue
   - Labels: `enhancement, map-generation, domain-layer, planned`

5. **building-condition-tactical-system.md** → Single issue
   - Labels: `enhancement, map-generation, domain-layer, planned`

6. **claude-powered-frontend.md** → Single issue
   - Labels: `enhancement, frontend, planned`

7. **mcp-server-for-api.md** → Single issue
   - Labels: `enhancement, infrastructure-layer, planned`

8. **complete-oxlint-migration.md** → Single issue
   - Labels: `enhancement, ci, planned`

## Issue Workflow

### Creating Issues
1. Check if issue already exists
2. Use appropriate template
3. Add all relevant labels
4. Link related issues
5. Add to project board if applicable

### Issue Lifecycle
1. **Created** - New issue, needs triage
2. **Triaged** - Labels added, priority set
3. **In Progress** - Someone is working on it
4. **Review** - PR submitted, needs review
5. **Closed** - Completed or won't fix

### Linking Issues to PRs
Always link issues in PR descriptions:
```markdown
Fixes #123
Partially addresses #456
Related to #789
```

## Milestones

Consider creating milestones for major releases:
- `v1.0 - Core Features` - Basic map generation
- `v1.1 - Persistence` - Save/load functionality
- `v1.2 - Export` - Multiple export formats
- `v2.0 - Social` - OAuth, sharing features

## Project Boards

Use GitHub Projects for visual tracking:
- **Backlog** - All open issues
- **To Do** - Prioritized for current sprint
- **In Progress** - Actively being worked on
- **Review** - PR submitted
- **Done** - Completed

## Best Practices

1. **One Issue, One Problem** - Don't combine multiple features
2. **Clear Titles** - Use prefixes like [FEATURE], [BUG], [CRITICAL]
3. **Link Documentation** - Reference relevant docs
4. **Update Status** - Comment on progress regularly
5. **Close Duplicates** - Link to original issue
6. **Use Checklists** - Break down complex tasks
7. **Add Context** - Include file paths, line numbers
8. **Test Cases** - Define how to verify completion

## Automation Ideas

Consider GitHub Actions for:
- Auto-labeling based on file changes
- Stale issue management
- PR-to-issue linking validation
- Security vulnerability scanning

## Example Issue Creation Commands

```bash
# Critical security bug
gh issue create \
  --title "🔴 [CRITICAL] Security vulnerability in auth" \
  --label "bug,security,backend" \
  --body "Security issue details..."

# New feature from planned docs
gh issue create \
  --title "🟢 [FEATURE] Discord OAuth Integration" \
  --label "enhancement,oauth,backend,planned" \
  --body "See docs/features/planned/discord-oauth-integration.md"

# Documentation improvement
gh issue create \
  --title "📝 [DOCS] Update API documentation" \
  --label "documentation,backend" \
  --body "Documentation needs..."
```

## Conclusion

Using GitHub Issues effectively will:
- Improve visibility of work
- Enable community contributions
- Track progress systematically
- Document decisions and discussions
- Link code changes to requirements

Remember: Issues are living documents - update them as understanding evolves!