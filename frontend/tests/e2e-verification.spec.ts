
import { test, expect } from '@playwright/test';

test.describe('E2E Verification: Admin Exam Creation -> User Attempt', () => {

    test('Full E2E Flow', async ({ page }) => {
        test.setTimeout(120000); // 2 minutes timeout for slow env
        // Unique identifiers for this run
        const timestamp = Date.now();
        const examTitle = `E2E Auto Exam ${timestamp}`;
        const userEmail = `e2e_user_${timestamp}@example.com`;
        const userPassword = 'TestUser123!';

        // --- Phase 1: Admin Workflow ---
        console.log('--- Phase 1: Starting Admin Workflow ---');

        // 1. Login as Admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@erankup.com');
        await page.fill('input[type="password"]', 'adminpassword'); // Try default first
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/\/admin/);
        await expect(page.locator('h1')).toContainText(/Admin Overview|Dashboard/i);

        // 2. Navigate to Exams Management
        await page.click('a[href="/admin/exams"]');
        await expect(page).toHaveURL(/.*\/admin\/exams/);

        // 3. Create New Exam (Using existing Wizard)
        // Click Create New Exam link - replacing with direct goto for reliability
        await page.goto('/admin/exams/new');

        // Step 1: Basic Info
        // Note: Inputs don't have name attributes, using placeholders/labels
        await page.fill('input[placeholder*="SSC CGL"]', examTitle);
        await page.fill('textarea[placeholder*="overview"]', 'Automated E2E Verification Exam');

        // Marks - using getByRole 'spinbutton' based on error log suggestion
        await page.getByRole('spinbutton').first().fill('2');
        await page.getByRole('spinbutton').nth(1).fill('0.5');
        await page.click('button:has-text("Continue to Chapters")');

        // Step 2: Add Chapters
        // "Finalize" button is disabled if no chapters, so we must add one.
        // Even if backend fails to save chapters, we need this to proceed in UI.
        await page.fill('input[placeholder*="Quantitative Aptitude"]', 'E2E Chapter 1');
        await page.click('button:has-text("Add Chapter to List")');

        // Now Finalize
        await page.click('button:has-text("Finalize")');

        // Step 3: Launch
        await page.click('button:has-text("Launch Examination")');

        // Wait for redirect to Exam Details (should have ID in URL)
        await expect(page).toHaveURL(/\/admin\/exams\/[a-f0-9-]+/);

        // 4. Add Test Model (using new Modal)
        await page.click('button:has-text("Create New Test")');

        // Select Subject (Assuming "General Awareness" exists from seed)
        // We wait for dropdown to populate
        await page.locator('select').first().click();
        await page.locator('select').first().selectOption({ index: 1 }); // Select first available subject

        // Select Chapter
        await page.locator('select').nth(1).selectOption({ index: 1 }); // Select first available chapter
        await page.click('button:has-text("Next Step")');

        // Fill Model Details
        const modelTitle = "E2E Test Set 1";
        await page.fill('input[placeholder*="Mock Test"]', modelTitle);
        await page.fill('input[type="number"]', '10'); // Duration
        await page.click('button:has-text("Create Test Module")');

        // Verify Model Created
        // Verify Model Created
        // Models are listed in collapsed accordions grouped by chapter.
        // We look for the group header that indicates we have a linked model.
        // Using a more specific selector for the text to ensure we click the interactive element
        await page.getByText('1 Model Sets Linked').first().click();
        await page.waitForTimeout(1000); // Wait for accordion animation

        await expect(page.getByText(modelTitle)).toBeVisible();

        // 5. Add Question
        // Find the "Add Q" button within the model row
        // We target the model card specifically
        const modelCard = page.locator('.group\\/model', { hasText: modelTitle }); // Escaping slash for CSS selector
        await modelCard.getByRole('button', { name: 'Add Q' }).click();

        // Fill Question Modal
        await page.fill('textarea', 'What is the implementation language of this project?');
        await page.fill('input[placeholder="Option 1"]', 'Python');
        await page.fill('input[placeholder="Option 2"]', 'TypeScript'); // Correct
        await page.fill('input[placeholder="Option 3"]', 'Java');
        await page.fill('input[placeholder="Option 4"]', 'C++');

        // Select Correct Option (B/2nd)
        // The modal uses click handlers on "A", "B", ... divs
        await page.click('text="B"');

        await page.click('button:has-text("Save Question")');

        // Verify question added count (should be 1 Qs)
        await page.reload();
        // Re-expand accordion after reload
        await page.getByText('1 Model Sets Linked').first().click();
        await page.waitForTimeout(1000); // Wait for accordion animation

        const modelCardReloaded = page.locator('.group\\/model', { hasText: modelTitle });
        await expect(modelCardReloaded.getByText('1 Qs')).toBeVisible();

        // 6. Publish Exam (It's created active by default in wizard logic usually, but let's check)
        // Current UI doesn't have an explicit Publish button on Details page, 
        // but checking if it's visible in list might be good.
        // For now, proceed.
        const publishBtn = page.locator('button', { hasText: /Publish|Activate/i });
        if (await publishBtn.isVisible()) {
            await publishBtn.click();
        }

        // --- Phase 2: User Workflow ---
        console.log('--- Phase 2: Starting User Workflow ---');

        // Logout Admin
        // Using simple navigation to logout endpoint or clearing cookies/storage would be safer
        // But UI logout is best practice.
        // await page.click('text=Logout'); 
        // Force logout via clearing context
        await page.context().clearCookies();
        await page.goto('/login');

        // 1. Register User
        await page.goto('/signup');
        await page.fill('input[name="fullName"]', 'E2E User');
        await page.fill('input[name="email"]', userEmail);
        await page.fill('input[name="password"]', userPassword);
        await page.fill('input[name="confirmPassword"]', userPassword);
        await page.click('button[type="submit"]');

        // Wait for redirect to Login (Current behavior)
        await expect(page).toHaveURL(/\/login/);

        // Log in with new credentials
        await page.fill('input[type="email"]', userEmail);
        await page.fill('input[type="password"]', userPassword);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);

        // 2. Find and Attempt Exam
        await page.click('a[href="/dashboard/exams"]');

        // Find the exam card
        await expect(page.locator(`text=${examTitle}`)).toBeVisible();

        // Start Exam (Using logic from free-exam.spec.ts)
        // Click View Test Series or similar
        // Use a more robust selector: Find the motion.div (card) that contains the title, then click the link inside it.
        // We use locator('.group') because the card has 'group' class (line 75 in page.tsx)
        const examCard = page.locator('.group', { hasText: examTitle }).first();
        await expect(examCard).toBeVisible();
        await examCard.getByRole('link', { name: 'View Test Series' }).click();

        // Select Model/Test inside
        await page.locator('h5').first().click();

        // Instructions
        const startBtn = page.locator('button:has-text("Begin"), button:has-text("Start")');
        if (await startBtn.isVisible()) {
            await startBtn.click();
        }

        // Answer Questions
        await expect(page.locator('.question-content, h3')).toBeVisible();
        await page.locator('input[type="radio"]').nth(1).click(); // Select second option
        await page.click('button:has-text("Save & Next"), button:has-text("Next")');

        // Submit
        await page.click('button:has-text("Submit")');
        await page.getByRole('button', { name: /yes|confirm/i }).click();

        // --- Phase 3: Analytics ---
        console.log('--- Phase 3: Verifying Analytics ---');

        await expect(page).toHaveURL(/.*results/);
        await expect(page.getByRole('heading', { name: 'Test Results' })).toBeVisible();
        await expect(page.getByText('Overall Score')).toBeVisible();
    });
});
