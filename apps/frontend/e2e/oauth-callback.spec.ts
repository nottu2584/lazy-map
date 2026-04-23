import { test, expect } from '@playwright/test';

test.describe('OAuth Callback', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/auth/profile', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          email: 'test@example.com',
          username: 'testuser',
        }),
      });
    });

    await page.route('**/api/auth/refresh', (route) => {
      route.fulfill({ status: 401, body: '{}' });
    });
  });

  test('success - shows welcome toast and redirects home', async ({ page }) => {
    await page.goto('/oauth/callback?status=success&provider=google&id=123&email=test@example.com&username=testuser');

    await page.waitForURL('/', { timeout: 5000 });

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('Welcome, testuser');
  });

  test('error - shows error toast and redirects home', async ({ page }) => {
    await page.goto('/oauth/callback?status=error&provider=google&error=Invalid+OAuth+state');

    await page.waitForURL('/', { timeout: 5000 });

    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('Sign-in failed');
    await expect(toast).toContainText('Invalid OAuth state');
  });

  test('success - user appears logged in', async ({ page }) => {
    await page.goto('/oauth/callback?status=success&provider=google&id=123&email=test@example.com&username=testuser');

    await page.waitForURL('/', { timeout: 5000 });

    await expect(page.getByText('SIGN IN')).not.toBeVisible({ timeout: 5000 });
  });
});
