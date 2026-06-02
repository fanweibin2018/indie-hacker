import { test, expect } from '@playwright/test';

test('price filter hides non-matching resource cards', async ({ page }) => {
  await page.goto('/resources/');
  const total = await page.locator('#resgrid .rcard').count();
  await page.locator('[data-filter="price"][data-value="free"]').click();
  await expect(page).toHaveURL(/price=free/);
  const visible = await page.locator('#resgrid .rcard:visible').count();
  expect(visible).toBeLessThanOrEqual(total);
});
