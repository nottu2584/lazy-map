# Visual Regression Testing

## Overview

Visual regression testing for Lazy Map frontend using Playwright. Tests validate that dependency updates don't introduce breaking UI changes.

## Strategy

Instead of pixel-perfect screenshot comparisons (unstable due to canvas/animations), we test:

1. **Runtime stability**: No JavaScript errors on page load
2. **Core UI rendering**: App mounts and displays content
3. **Responsive behavior**: Mobile viewports render correctly

## Running Tests

```bash
# Run all e2e tests
pnpm --filter frontend test:e2e

# Run with UI mode (interactive)
pnpm --filter frontend test:e2e:ui
```

## Test Coverage

- **Homepage load**: Verifies React app mounts without errors
- **Core UI elements**: Checks that content renders (not white screen)
- **Responsive mobile**: Tests mobile viewport rendering

## Adding New Tests

Add tests to `apps/frontend/e2e/visual-regression.spec.ts`:

```typescript
test('new feature - renders correctly', async ({ page }) => {
  await page.goto('/new-feature');
  await page.waitForLoadState('networkidle');

  // Check for specific element
  await expect(page.locator('[data-testid="feature"]')).toBeVisible();
});
```

## CI/CD Integration

Tests run automatically in PR validation workflow. Failed tests block merge.

## Troubleshooting

**Test timeouts**: Increase `timeout` in `playwright.config.ts`

**Port conflicts**: Ensure port 5173 is available (dev server)

**Browser issues**: Reinstall browsers with `pnpm --filter frontend exec playwright install chromium`
