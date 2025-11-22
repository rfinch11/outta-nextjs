import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads and displays the Outta logo', async ({ page }) => {
    const logo = page.locator('img[alt*="Outta"]');
    await expect(logo).toBeVisible();
  });

  test('displays tab navigation (Events, Activities, Camps)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Events' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Activities' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Camps' })).toBeVisible();
  });

  test('displays at least one listing card', async ({ page }) => {
    // Wait for listings to load
    await page.waitForSelector('a[href^="/listings/"]', { timeout: 10000 });

    const cards = page.locator('a[href^="/listings/"]');
    await expect(cards.first()).toBeVisible();
  });

  test('can switch between tabs', async ({ page }) => {
    // Click on Activities tab
    await page.click('button:has-text("Activities")');

    // Wait for the content to update
    await page.waitForTimeout(500);

    // Click on Camps tab
    await page.click('button:has-text("Camps")');

    // Wait for the content to update
    await page.waitForTimeout(500);

    // Switch back to Events
    await page.click('button:has-text("Events")');
  });

  test('can open search modal', async ({ page }) => {
    // Look for search button/icon
    const searchButton = page.locator('button:has-text("Search"), button[aria-label*="Search"], button[aria-label*="search"]').first();

    if (await searchButton.count() > 0) {
      await searchButton.click();

      // Check if search modal is visible
      await expect(page.getByPlaceholderText(/search/i)).toBeVisible();
    }
  });

  test('can navigate to listing detail page', async ({ page }) => {
    // Wait for listings to load
    await page.waitForSelector('a[href^="/listings/"]', { timeout: 10000 });

    // Click on first listing card
    const firstCard = page.locator('a[href^="/listings/"]').first();
    await firstCard.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/listings\/.+/);

    // Detail page should have a title
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('displays footer with links', async ({ page }) => {
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Check for footer links
    await expect(page.getByRole('link', { name: /privacy/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /terms/i })).toBeVisible();
  });
});
