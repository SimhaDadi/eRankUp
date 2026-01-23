import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'admin@erankup.com';
const ADMIN_PASSWORD = 'adminpassword';
const STUDENT_EMAIL = 'student@test.com';
const STUDENT_PASSWORD = 'student123';

test('Smoke Test: Admin Hierarchy and Student Login', async ({ page }) => {
    // 1. Admin Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin
    await page.waitForURL(/\/admin/, { timeout: 10000 });

    // 2. Navigate to Hierarchy
    const hierarchyLink = page.locator('nav').getByText('Hierarchy', { exact: false });
    if (await hierarchyLink.isVisible()) {
        await hierarchyLink.click();
    } else {
        await page.goto(`${BASE_URL}/admin/hierarchy`);
    }

    await expect(page.locator('h1')).toContainText('Content Hierarchy');

    // 3. Create Question Bank
    await page.click('button:has-text("Add Question Bank")');
    await page.fill('input[placeholder*="e.g., SSC CGL"]', 'Smoke Test Bank');
    await page.fill('textarea[placeholder*="description"]', 'Created by Smoke Test');
    await page.click('button:has-text("Create Exam")');

    // Verify creation
    await expect(page.locator('text=Smoke Test Bank')).toBeVisible({ timeout: 5000 });

    // 4. Logout Admin
    // Profile icon usually top right. If selector unknown, try navigating to logout or finding unique element
    // Assuming a logout button exists or we can just clear cookies.
    // Let's rely on UI interaction.
    // Try to find an "S" avatar or "Logout" text.
    const logoutBtn = page.getByText('Logout');
    if (await logoutBtn.isVisible()) {
        await logoutBtn.click();
    } else {
        // Fallback: clear cookies/storage to simulate logout if UI is tricky
        await page.context().clearCookies();
        await page.goto(`${BASE_URL}/login`);
    }
    await page.waitForURL(/\/login|$/);

    // 5. Student Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for redirect to /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/.*dashboard/);

    console.log('Smoke Test Passed');
});
