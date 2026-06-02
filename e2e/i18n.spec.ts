import { test, expect } from '@playwright/test';

test('language toggle switches between zh and en mirror', async ({ page }) => {
  await page.goto('/discover/');
  await page.locator('.lang-toggle').click();
  await expect(page).toHaveURL(/\/en\/discover\/$/);
  await expect(page.getByRole('heading', { name: 'Discover' })).toBeVisible();
});
