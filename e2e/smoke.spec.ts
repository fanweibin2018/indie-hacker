import { test, expect } from '@playwright/test';

test('home renders hero and five phase entries', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.phase-entry')).toHaveCount(5);
});

test('phase page renders articles and resources sections', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.getByRole('heading', { name: '需求挖掘' })).toBeVisible();
  await expect(page.locator('.resource-card').first()).toBeVisible();
});
