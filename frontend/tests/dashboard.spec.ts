import { test, expect } from '@playwright/test';

test.describe('Dashboard Functionality', () => {
    const testEmail = `dashuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const fullName = 'Dash User';

    test.beforeEach(async ({ page }) => {
        // 1. Sign Up a new user
        await page.goto('/signup');
        await page.fill('input[name="fullName"]', fullName);
        await page.fill('input[name="email"]', testEmail);
        await page.fill('input[name="password"]', testPassword);
        await page.fill('input[name="confirmPassword"]', testPassword);

        await Promise.all([
            page.waitForURL('**/login'),
            page.click('button[type="submit"]')
        ]);

        // 2. Login
        await page.fill('input[type="email"]', testEmail);
        await page.fill('input[type="password"]', testPassword);

        await Promise.all([
            page.waitForURL('**/dashboard'),
            page.click('button[type="submit"]')
        ]);
    });

    test('Dashboard displays key stats and widgets', async ({ page }) => {
        // Check for welcome message
        await expect(page.locator('h1')).toContainText(/Welcome back/i);

        // Check for stats widgets with exact matching to avoid ambiguity
        await expect(page.getByText('Average Score', { exact: true })).toBeVisible();
        await expect(page.getByText('Total Tests', { exact: true })).toBeVisible();
        await expect(page.getByText('Accuracy', { exact: true })).toBeVisible();
        await expect(page.getByText('Study Time', { exact: true })).toBeVisible();
    });

    test('Sidebar navigation works', async ({ page }) => {
        // Navigate to Exams
        await page.click('nav >> text=My Exams');
        await expect(page).toHaveURL(/.*dashboard\/exams/);

        // Navigate to Performance
        await page.click('nav >> text=Performance');
        await expect(page).toHaveURL(/.*dashboard\/performance/);

        // Navigate back to Dashboard
        await page.click('nav >> text=Dashboard');
        await expect(page).toHaveURL(/.*dashboard/);
    });
});
