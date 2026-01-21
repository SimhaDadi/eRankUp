import { test, expect } from '@playwright/test';

test('Smoke Test: Landing Page and Auth Redirect', async ({ page }) => {
    // 1. Visit Landing Page
    await page.goto('/');

    // Verify title or key text exists (Assuming "eRankUp" is in title or a header)
    // Adjust this selector based on actual homepage content if needed
    await expect(page).toHaveTitle(/eRankUp/i);

    // 2. Visit Dashboard (Protected Route)
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('h2')).toContainText(/Welcome Back/i);
});
