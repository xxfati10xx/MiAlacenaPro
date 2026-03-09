import { test, expect } from '@playwright/test';

test('Verify MiAlacena Pro features and take screenshots', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:8080');
  await page.waitForSelector('#root');

  // 1. Add a product
  await page.click('nav button:nth-child(3)'); // Add tab
  await page.getByPlaceholder('Ej. Leche de Almendras').fill('Leche');
  // Fill stock (the first number input)
  await page.locator('input[type="number"]').first().fill('1');
  // Fill min (the second number input)
  await page.locator('input[type="number"]').nth(1).fill('2');

  // Save
  await page.click('button:has-text("Guardar")');

  // Verify it was added to Pantry
  await page.click('nav button:nth-child(1)'); // Pantry tab
  await expect(page.locator('text=Leche')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/pantry_populated.png' });

  // 2. Check Stats
  await page.click('nav button:nth-child(2)'); // Stats tab
  await expect(page.locator('h4:has-text("50%")')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/stats_populated.png' });

  // 3. Check Cart
  await page.click('nav button:nth-child(4)'); // Cart tab
  await expect(page.locator('text=Leche')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/cart_populated.png' });

  // 4. Test Dark Mode
  await page.click('header button:nth-child(1)'); // Dark mode toggle
  await page.screenshot({ path: '/home/jules/verification/dark_mode.png' });

  // 5. Check Language Selector
  await page.selectOption('header select', 'en');
  await expect(page.locator('text=Pantry')).toBeVisible();
});
