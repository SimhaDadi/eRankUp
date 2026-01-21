import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const fullName = 'Test User';

    test('User can sign up and then login', async ({ page }) => {
        // 1. Sign Up
        await page.goto('/signup');
        await page.fill('input[name="fullName"]', fullName);
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);

        // Wait for signup to complete and redirect to login
        await Promise.all([
            page.waitForURL('**/login'),
            page.click('button[type="submit"]')
        ]);

        // 2. Login
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        // Wait for login to complete and redirect to dashboard
        await Promise.all([
            page.waitForURL('**/dashboard'),
            page.click('button[type="submit"]')
        ]);

        // 3. Verify Dashboard
        await expect(page).toHaveURL(/.*dashboard/);
        await expect(page.locator('h1')).toContainText(/Welcome back/i);
    });

    test('Login fails with incorrect credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'WrongPassword123');
        await page.click('button[type="submit"]');

        // Assuming there's an error message displayed
        const errorText = page.locator('p.text-red-500');
        await expect(errorText).toBeVisible();
    });
});
