import { test, expect } from '@playwright/test';

test.describe('Admin Functionalities', () => {
    const adminEmail = 'admin@erankup.com';
    const adminPassword = 'AdminPassword123!';

    test.beforeEach(async ({ page }) => {
        // Admin Login
        await page.goto('/login');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/admin');
    });

    test('Admin Dashboard shows overview and stats', async ({ page }) => {
        await expect(page.locator('h1')).toContainText(/Admin Overview/i);
        await expect(page.getByText('Active Students')).toBeVisible();
        await expect(page.getByText('Total Exams')).toBeVisible();
        await expect(page.getByText('Submissions Today')).toBeVisible();
        await expect(page.getByText('Security Logs')).toBeVisible();
    });

    test('Manage Exams page lists exams and allows search', async ({ page }) => {
        await page.goto('/admin/exams');
        await expect(page.locator('h1')).toContainText(/Manage Exams/i);

        // Check if at least some exams are loaded (assuming seed data exists)
        const examCards = page.locator('.bg-slate-900.border.border-slate-800');
        await expect(examCards.first()).toBeVisible();

        // Test Search functionality
        await page.fill('input[placeholder="Search exams by title..."]', 'SSC');
        // Wait for filtering (assuming SSC exists from general seed)
        await expect(page.getByText(/SSC/i).first()).toBeVisible();
    });

    test('User Management page lists users', async ({ page }) => {
        await page.goto('/admin/users');
        await expect(page.locator('h1')).toContainText(/Student Management/i);

        // Check if users table is visible
        await expect(page.locator('table')).toBeVisible();

        // Check for specific columns
        await expect(page.getByText('User', { exact: true })).toBeVisible();
        await expect(page.getByText('Role', { exact: true })).toBeVisible();
        await expect(page.getByText('Joined At', { exact: true })).toBeVisible();
    });

    test('Admin can navigate between admin sections', async ({ page }) => {
        // Navigate to Exams
        await page.click('nav >> text=Manage Exams');
        await expect(page).toHaveURL(/.*\/admin\/exams/);

        // Navigate to Users
        await page.click('nav >> text=Users');
        await expect(page).toHaveURL(/.*\/admin\/users/);

        // Navigate back to Admin Dashboard
        await page.click('nav >> text=Dashboard');
        await expect(page).toHaveURL(/.*\/admin/);
    });
});
