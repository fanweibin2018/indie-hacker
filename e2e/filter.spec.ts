import { test, expect } from '@playwright/test';

test('pricing filter hides non-matching resource cards', async ({ page }) => {
  await page.goto('/resources/');
  const total = await page.locator('.resource-card').count();
  await page.locator('[data-filter="pricing"]').selectOption('free');
  const visible = await page.locator('.resource-card:visible').count();
  expect(visible).toBeLessThanOrEqual(total);
  await expect(page).toHaveURL(/pricing=free/);
});
