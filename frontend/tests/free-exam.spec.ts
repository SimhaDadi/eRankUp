import { test, expect } from '@playwright/test';

test.describe('Free Exam Flow', () => {
    let authToken: string;
    let userEmail: string;
    let examId: string;

    test.beforeEach(async ({ request }) => {
        // 1. Create unique user
        const timestamp = Date.now();
        userEmail = `e2e_student_${timestamp}@test.com`;
        const password = 'Password@123';

        const signupRes = await request.post('http://localhost:3001/auth/signup', {
            data: {
                email: userEmail,
                password: password,
                fullName: 'E2E Student'
            }
        });
        expect(signupRes.ok()).toBeTruthy();

        // 2. Login to get token
        const loginRes = await request.post('http://localhost:3001/auth/login', {
            data: { email: userEmail, password: password }
        });
        expect(loginRes.ok()).toBeTruthy();
        const loginData = await loginRes.json();
        authToken = loginData.access_token;

        // 3. Seed Exam Data (Idempotent-ish, or ensures at least one exists)
        // We'll use the specific seed endpoint we saw in simulate_flow.ts
        const seedRes = await request.get('http://localhost:3001/exams/seed-ssc-2028');
        expect(seedRes.ok()).toBeTruthy();
        const seedData = await seedRes.json();
        // Use the examId from seed result if available, or fetch list
        // simulate_flow says seedData.modelId returns a model, let's see if we can get the main exam ID
        // Actually the seed-ssc-2028 creates "SSC CGL 2028" exam.
    });

    test('User can take a free exam and see results', async ({ page, request }) => {
        // 0. Manual Login by setting state or just UI login? 
        // UI login is safer for "E2E" proof. Let's do UI login quickly.
        await page.goto('/login');
        await page.fill('input[type="email"]', userEmail);
        await page.fill('input[type="password"]', 'Password@123');
        await page.click('button[type="submit"]');

        // Wait for redirect
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('h1')).toContainText(/Welcome/i);

        // 1. Navigate to Exams
        await page.click('text=Take a New Test'); // Link on dashboard main
        await expect(page).toHaveURL('/dashboard/exams');

        // 2. Find and Select the Test Series
        // We look for "SSC CGL 2028" which is created by the seed
        // Use a more specific locator for the card to avoid selecting parent containers
        // We find a container that has the title "SSC CGL 2028" and the link "View Test Series"
        // And we ensure it's a leaf card by checking some class or structure if possible, 
        // or just use chaining that ensures strict association.
        // Monitor API calls
        page.on('response', async response => {
            if (response.url().includes('/exams/') && response.status() === 200) {
                try {
                    const json = await response.json();
                    console.log(`API Response for ${response.url()}:`, JSON.stringify(json, null, 2));
                } catch (e) { }
            }
        });

        // Strategy: Find the card by its title (h2), then find the "View Test Series" link within it.
        await page.locator('div.bg-white')
            .filter({ has: page.locator('h2', { hasText: /SSC CGL 2028/i }) })
            .getByRole('link', { name: 'View Test Series' })
            .click();

        // 3. Inside Exam Details - Find a Free Test
        // We need to know what the Exam Details page looks like. 
        // Assuming there's a list of "Models" or "Tests".
        // We'll look for a button "Start Test" or similar.
        // 3. Inside Exam Details - Find a Free Test
        // The "Start Test" button is hidden by default (opacity 0) and appears on hover.
        // But the whole card is a Link. So we can click the model title or the card itself.
        // Let's wait for models to load.
        try {
            await expect(page.locator('h5').first()).toBeVisible({ timeout: 5000 });
        } catch (e) {
            console.log('Main content:', await page.locator('main').innerHTML());
            console.log('Body text:', await page.innerText('body'));
            throw e;
        }

        // Click the first available model card
        await page.locator('h5').first().click();

        // 4. Test Interface (Instructions -> Start)
        // Likely an instructions modal or page
        // Look for "I Agree" or "Begin"
        if (await page.locator('text=Instructions').isVisible()) {
            const proceedBtn = page.locator('button:has-text("Begin"), button:has-text("Start")');
            if (await proceedBtn.isVisible()) {
                await proceedBtn.click();
            }
        }

        // 5. Taking the Test
        // Check if question is visible
        await expect(page.locator('.question-content, .question-text, h3')).toBeVisible({ timeout: 10000 });

        // Select an option (radio button or div)
        // Assuming standard structure like input[type=radio] or similar
        const firstOption = page.locator('input[type="radio"], .option').first();
        await firstOption.click();

        // Click Save & Next
        await page.click('button:has-text("Save & Next"), button:has-text("Next")');

        // 6. Submit Test
        // Often there is a Submit button in top right or sidebar
        const submitButton = page.getByRole('button', { name: /submit/i }).first();
        if (await submitButton.isVisible()) {
            await submitButton.click();
        } else {
            // Fallback or debug
            await page.click('text=Submit Test');
        }

        // Confirmation Modal
        await page.getByRole('button', { name: /yes|confirm/i }).click();

        // 7. Verification - Result Page
        await expect(page).toHaveURL(/.*results.*/);
        // Check for Score or Rank
        await expect(page.locator('text=Score')).toBeVisible();
        await expect(page.locator('text=Accuracy')).toBeVisible();
    });
});
