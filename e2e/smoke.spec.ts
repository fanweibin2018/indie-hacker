import { test, expect } from '@playwright/test';

test('home renders hero and five phase entries', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('.pindex a')).toHaveCount(5);
});

test('phase page renders heading and first resource card', async ({ page }) => {
  await page.goto('/discover/');
  await expect(page.getByRole('heading', { name: '需求挖掘', exact: true })).toBeVisible();
  await expect(page.locator('#resgrid .rcard').first()).toBeVisible();
});
