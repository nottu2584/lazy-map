import { test, expect } from '@playwright/test';

/**
 * Visual regression tests to catch UI changes from dependency updates
 *
 * Strategy: Test build success + runtime errors rather than pixel-perfect snapshots
 * since the app has dynamic content (canvas, animations, async data).
 */

test.describe('Visual Regression Tests', () => {
  test('homepage - loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check React app mounted
    const root = await page.locator('#root').count();
    expect(root).toBe(1);

    // Check no JS errors
    expect(errors).toEqual([]);
  });

  test('core UI elements - render correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check critical UI elements exist
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Verify app initialized (not white screen / crash)
    const contentLength = await page.evaluate(() => {
      return document.body.textContent?.trim().length ?? 0;
    });
    expect(contentLength).toBeGreaterThan(0);
  });

  test('responsive - mobile viewport renders', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify app renders in mobile viewport
    const root = await page.locator('#root').count();
    expect(root).toBe(1);

    const contentLength = await page.evaluate(() => {
      return document.body.textContent?.trim().length ?? 0;
    });
    expect(contentLength).toBeGreaterThan(0);
  });
});
