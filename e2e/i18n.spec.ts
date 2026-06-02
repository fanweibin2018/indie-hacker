import { test, expect } from '@playwright/test';

test('language toggle switches to EN mirror', async ({ page }) => {
  await page.goto('/discover/');
  await page.locator('.langtog a', { hasText: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/discover\/$/);
  await expect(page.getByRole('heading', { name: 'Discover', exact: true })).toBeVisible();
});
