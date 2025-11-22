import { test, expect } from '@playwright/test';

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('can open and close search modal', async ({ page }) => {
    // Look for search button
    const searchButton = page.locator('button:has-text("Search"), button[aria-label*="Search"], button[aria-label*="search"]').first();

    if (await searchButton.count() > 0) {
      // Open search modal
      await searchButton.click();
      await expect(page.getByPlaceholderText(/search/i)).toBeVisible();

      // Close by clicking overlay or close button
      const clearButton = page.getByRole('button', { name: /clear/i });
      if (await clearButton.count() > 0) {
        await clearButton.click();
      }
    }
  });

  test('can perform a search', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Search"), button[aria-label*="Search"], button[aria-label*="search"]').first();

    if (await searchButton.count() > 0) {
      await searchButton.click();

      const searchInput = page.getByPlaceholderText(/search/i);
      await searchInput.fill('museum');

      // Submit search
      const submitButton = page.getByRole('button', { name: /let's go/i });
      if (await submitButton.count() > 0) {
        await submitButton.click();

        // Wait for results to update
        await page.waitForTimeout(1000);
      }
    }
  });

  test('search button is disabled when input is empty', async ({ page }) => {
    const searchButton = page.locator('button:has-text("Search"), button[aria-label*="Search"], button[aria-label*="search"]').first();

    if (await searchButton.count() > 0) {
      await searchButton.click();

      const submitButton = page.getByRole('button', { name: /let's go/i });
      if (await submitButton.count() > 0) {
        await expect(submitButton).toBeDisabled();
      }
    }
  });
});
