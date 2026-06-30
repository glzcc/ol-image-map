import { expect, test } from '@playwright/test';

test('renders the image map demo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '选择' })).toBeVisible();
  await expect(page.locator('.ol-image-map canvas').first()).toBeVisible();
  await expect(page.getByText('客厅')).toBeVisible();
});

test('creates a point marker from the toolbar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '点位', exact: true }).click();
  await page.locator('.ol-image-map').click({ position: { x: 240, y: 260 } });
  await expect(page.getByText('新点位')).toBeVisible();
});
