import { test, expect } from '@playwright/test';

/**
 * End-to-End Test: Complete User Flow
 * Tests the entire journey from admin question upload to student analytics
 * 
 * Flow:
 * 1. Admin Login
 * 2. Create Hierarchy (Exam → Subject → Chapter)
 * 3. Upload Questions
 * 4. Create Exam
 * 5. Student Login
 * 6. Attempt Exam
 * 7. View Results & Analytics
 */

const ADMIN_EMAIL = 'admin@erankup.com';
const ADMIN_PASSWORD = 'adminpassword';
const STUDENT_EMAIL = 'student@test.com';
const STUDENT_PASSWORD = 'student123';

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001';

test.describe('Complete E2E Flow: Admin to Student Analytics', () => {

    test.beforeAll(async () => {
        // Ensure backend is running
        const response = await fetch(`${API_URL}/health`).catch(() => null);
        if (!response) {
            throw new Error('Backend server is not running. Please start it first.');
        }
    });

    test('Full Flow: Hierarchy → Questions → Exam → Attempt → Analytics', async ({ page }) => {

        // ============================================
        // PHASE 1: ADMIN - CREATE HIERARCHY
        // ============================================

        await test.step('Admin Login', async () => {
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', ADMIN_EMAIL);
            await page.fill('input[type="password"]', ADMIN_PASSWORD);
            await page.click('button[type="submit"]');

            // Wait for redirect to dashboard
            await page.waitForURL('**/admin**', { timeout: 10000 });
            await expect(page).toHaveURL(/\/admin/);
        });

        await test.step('Navigate to Hierarchy Management', async () => {
            await page.goto(`${BASE_URL}/admin/hierarchy`);
            await expect(page.locator('h1')).toContainText('Content Hierarchy');
        });

        await test.step('Create Exam', async () => {
            // Click Add Question Bank button
            await page.click('button:has-text("Add Question Bank")');

            // Fill exam form
            await page.fill('input[placeholder*="SSC CGL"]', 'SSC CGL 2024 Test');
            await page.fill('textarea[placeholder*="description"]', 'Test exam for E2E testing');

            // Submit
            await page.click('button:has-text("Create Exam")');

            // Wait for success
            await page.waitForTimeout(1000);
            await expect(page.locator('text=SSC CGL 2024 Test')).toBeVisible();
        });

        await test.step('Create Subject', async () => {
            // Expand exam
            await page.click('text=SSC CGL 2024 Test');

            // Click Add Subject
            await page.click('button:has-text("Add Subject")');

            // Fill subject form
            await page.fill('input[placeholder*="Mathematics"]', 'Mathematics');

            // Submit
            await page.click('button:has-text("Create Subject")');

            // Wait for success
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Mathematics')).toBeVisible();
        });

        await test.step('Create Chapter', async () => {
            // Expand subject
            await page.click('text=Mathematics');

            // Click Add Chapter
            await page.click('button:has-text("Add Chapter")');

            // Fill chapter form
            await page.fill('input[placeholder*="Algebra"]', 'Algebra');

            // Submit
            await page.click('button:has-text("Create Chapter")');

            // Wait for success
            await page.waitForTimeout(1000);
            await expect(page.locator('text=Algebra')).toBeVisible();
        });

        // ============================================
        // PHASE 2: ADMIN - UPLOAD QUESTIONS
        // ============================================

        await test.step('Navigate to Question Bank', async () => {
            await page.goto(`${BASE_URL}/admin/question-bank`);
            await expect(page.locator('h1')).toContainText('Question Bank');
        });

        await test.step('Add Question with Hierarchy', async () => {
            // Click Add Question tab
            await page.click('button:has-text("Add Question")');

            // Fill question text
            await page.fill('textarea[placeholder*="question text"]', 'What is 2 + 2?');

            // Fill options
            await page.fill('input[placeholder*="Option 1"]', '3');
            await page.fill('input[placeholder*="Option 2"]', '4');
            await page.fill('input[placeholder*="Option 3"]', '5');
            await page.fill('input[placeholder*="Option 4"]', '6');

            // Select correct answer
            await page.selectOption('select:near(:text("Correct Answer"))', '1'); // Option 2 (4)

            // Select hierarchy
            await page.selectOption('select:near(:text("Exam"))', { label: 'SSC CGL 2024 Test' });
            await page.waitForTimeout(500); // Wait for subjects to load

            await page.selectOption('select:near(:text("Subject"))', { label: 'Mathematics' });
            await page.waitForTimeout(500); // Wait for chapters to load

            await page.selectOption('select:near(:text("Chapter"))', { label: 'Algebra' });

            // Fill topic and difficulty
            await page.fill('input[placeholder*="topic"]', 'Basic Arithmetic');
            await page.selectOption('select:near(:text("Difficulty"))', 'easy');

            // Submit
            await page.click('button[type="submit"]:has-text("Add Question")');

            // Wait for success
            await page.waitForTimeout(1000);
        });

        await test.step('Add More Questions', async () => {
            // Add 4 more questions for a complete test
            const questions = [
                { q: 'What is 5 × 3?', opts: ['10', '15', '20', '25'], correct: 1, topic: 'Multiplication' },
                { q: 'What is 10 - 7?', opts: ['2', '3', '4', '5'], correct: 1, topic: 'Subtraction' },
                { q: 'What is 12 ÷ 4?', opts: ['2', '3', '4', '5'], correct: 1, topic: 'Division' },
                { q: 'What is 8 + 7?', opts: ['13', '14', '15', '16'], correct: 2, topic: 'Addition' },
            ];

            for (const question of questions) {
                await page.fill('textarea[placeholder*="question text"]', question.q);
                await page.fill('input[placeholder*="Option 1"]', question.opts[0]);
                await page.fill('input[placeholder*="Option 2"]', question.opts[1]);
                await page.fill('input[placeholder*="Option 3"]', question.opts[2]);
                await page.fill('input[placeholder*="Option 4"]', question.opts[3]);
                await page.selectOption('select:near(:text("Correct Answer"))', question.correct.toString());
                await page.fill('input[placeholder*="topic"]', question.topic);
                await page.click('button[type="submit"]:has-text("Add Question")');
                await page.waitForTimeout(1000);
            }
        });

        // ============================================
        // PHASE 3: STUDENT - ATTEMPT EXAM
        // ============================================

        await test.step('Logout Admin', async () => {
            await page.click('button:has-text("Logout"), a:has-text("Logout")');
            await page.waitForURL('**/login', { timeout: 5000 });
        });

        await test.step('Student Login', async () => {
            await page.goto(`${BASE_URL}/login`);
            await page.fill('input[type="email"]', STUDENT_EMAIL);
            await page.fill('input[type="password"]', STUDENT_PASSWORD);
            await page.click('button[type="submit"]');

            // Wait for redirect to dashboard
            await page.waitForURL('**/dashboard', { timeout: 5000 });
        });

        await test.step('Browse and Start Exam', async () => {
            // Navigate to exams
            await page.goto(`${BASE_URL}/exams`);

            // Find and click on SSC CGL exam
            await page.click('text=SSC CGL 2024 Test');

            // Start exam
            await page.click('button:has-text("Start Exam"), button:has-text("Begin Test")');

            // Wait for exam to load
            await expect(page.locator('text=Question 1')).toBeVisible({ timeout: 5000 });
        });

        await test.step('Answer Questions', async () => {
            // Answer all 5 questions (4 correct, 1 wrong for testing)
            const answers = [1, 1, 1, 0, 2]; // Indices of options to click

            for (let i = 0; i < answers.length; i++) {
                // Wait for question to be visible
                await page.waitForSelector(`text=Question ${i + 1}`, { timeout: 3000 });

                // Click the answer option
                const optionSelector = `label:has-text("Option ${answers[i] + 1}"), input[value="${answers[i]}"]`;
                await page.click(optionSelector);

                // Click Next or Submit
                if (i < answers.length - 1) {
                    await page.click('button:has-text("Next")');
                } else {
                    await page.click('button:has-text("Submit")');
                }

                await page.waitForTimeout(500);
            }
        });

        await test.step('Confirm Submission', async () => {
            // Confirm submission if there's a confirmation dialog
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
            if (await confirmButton.isVisible()) {
                await confirmButton.click();
            }

            // Wait for results page
            await page.waitForURL('**/results/**', { timeout: 10000 });
        });

        // ============================================
        // PHASE 4: STUDENT - VIEW ANALYTICS
        // ============================================

        await test.step('Verify Results Page', async () => {
            // Check for score display
            await expect(page.locator('text=Score, text=Your Score')).toBeVisible();

            // Check for accuracy
            await expect(page.locator('text=Accuracy, text=80%')).toBeVisible(); // 4/5 correct

            // Check for time taken
            await expect(page.locator('text=Time Taken')).toBeVisible();
        });

        await test.step('View Detailed Analytics', async () => {
            // Navigate to analytics/insights
            await page.click('button:has-text("View Insights"), a:has-text("Analytics")');

            // Verify insights are displayed
            await expect(page.locator('text=Performance Analysis, text=Insights')).toBeVisible();

            // Check for topic-wise breakdown
            await expect(page.locator('text=Topic-wise Performance, text=Subject Analysis')).toBeVisible();

            // Check for recommendations
            await expect(page.locator('text=Recommendations, text=Suggested Topics')).toBeVisible();
        });

        await test.step('Verify Personalized Recommendations', async () => {
            // Check that AI recommendations are present
            const recommendations = page.locator('[data-testid="recommendations"], .recommendations');
            await expect(recommendations).toBeVisible();

            // Verify at least one recommendation exists
            const recommendationItems = page.locator('.recommendation-item, [data-testid="recommendation"]');
            await expect(recommendationItems.first()).toBeVisible();
        });

        // ============================================
        // PHASE 5: VERIFICATION
        // ============================================

        await test.step('Verify Complete Flow Success', async () => {
            // Take screenshot of final analytics page
            await page.screenshot({ path: 'test-results/e2e-complete-flow.png', fullPage: true });

            console.log('✅ Complete E2E flow test passed successfully!');
            console.log('   - Hierarchy created');
            console.log('   - Questions uploaded');
            console.log('   - Exam attempted');
            console.log('   - Analytics viewed');
        });
    });
});
