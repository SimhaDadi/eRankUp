# E2E Testing Guide - eRankUp Platform

## 🎯 Complete Flow Test

This test covers the entire user journey from admin question upload to student analytics.

## 📋 Prerequisites

### 1. Install Playwright
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

### 2. Start Backend Server
```bash
cd backend
npm run start:dev
```

### 3. Ensure Test Users Exist

**Admin User:**
- Email: `admin@erankup.com`
- Password: `admin123`

**Student User:**
- Email: `student@test.com`
- Password: `student123`

If these users don't exist, create them manually or via seed script.

## 🚀 Running Tests

### Run All E2E Tests
```bash
cd frontend
npx playwright test
```

### Run Specific Test
```bash
npx playwright test complete-flow.spec.ts
```

### Run with UI Mode (Recommended for Debugging)
```bash
npx playwright test --ui
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Debug Mode
```bash
npx playwright test --debug
```

## 📊 Test Coverage

The E2E test covers:

### Phase 1: Admin - Create Hierarchy
- ✅ Admin login
- ✅ Navigate to hierarchy management
- ✅ Create exam (SSC CGL 2024 Test)
- ✅ Create subject (Mathematics)
- ✅ Create chapter (Algebra)

### Phase 2: Admin - Upload Questions
- ✅ Navigate to question bank
- ✅ Add question with hierarchy selection
- ✅ Fill question details (text, options, correct answer)
- ✅ Select exam → subject → chapter (cascading)
- ✅ Add multiple questions (5 total)

### Phase 3: Student - Attempt Exam
- ✅ Student login
- ✅ Browse available exams
- ✅ Start exam attempt
- ✅ Answer all questions
- ✅ Submit attempt

### Phase 4: Student - View Analytics
- ✅ View results page
- ✅ Check score and accuracy
- ✅ View detailed analytics
- ✅ See personalized recommendations
- ✅ Verify AI-powered insights

## 🎬 Test Flow Diagram

```
Admin Login
    ↓
Create Hierarchy (Exam → Subject → Chapter)
    ↓
Upload 5 Questions
    ↓
Logout
    ↓
Student Login
    ↓
Browse & Start Exam
    ↓
Answer Questions (4 correct, 1 wrong)
    ↓
Submit Attempt
    ↓
View Results (80% accuracy)
    ↓
View Analytics & Insights
    ↓
✅ Test Complete
```

## 📸 Test Artifacts

After running tests, check:

- **Screenshots**: `test-results/e2e-complete-flow.png`
- **Videos**: `test-results/videos/` (on failure)
- **Traces**: `test-results/traces/` (on failure)
- **HTML Report**: `playwright-report/index.html`

## 🔍 Viewing Test Results

### Open HTML Report
```bash
npx playwright show-report
```

### View Trace
```bash
npx playwright show-trace test-results/traces/trace.zip
```

## ⚠️ Troubleshooting

### Test Fails at Login
- Verify users exist in database
- Check credentials match
- Ensure backend is running

### Hierarchy Creation Fails
- Check API endpoints are accessible
- Verify admin has proper permissions
- Check database connections

### Questions Not Appearing
- Verify questions were created successfully
- Check hierarchy relationships in database
- Ensure exam has questions assigned

### Analytics Not Showing
- Verify attempt was submitted
- Check scoring service is working
- Ensure AI service is configured

## 🎯 Expected Results

**Successful Test Run:**
- ✅ All steps pass
- ✅ Screenshot captured
- ✅ No errors in console
- ✅ Analytics page displays correctly

**Test Metrics:**
- Duration: ~2-3 minutes
- Questions: 5
- Accuracy: 80% (4/5 correct)
- Score: Calculated based on marking scheme

## 🔄 Continuous Integration

To run in CI/CD:

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 📝 Notes

- Tests run sequentially (not parallel)
- Backend must be running before tests
- Frontend dev server starts automatically
- Test data is created during test run
- Clean up test data after if needed

## 🎉 Success Criteria

Test passes when:
1. Hierarchy is created successfully
2. All 5 questions are uploaded
3. Student can attempt exam
4. Results show 80% accuracy
5. Analytics page displays insights
6. No errors in console

---

**Happy Testing!** 🚀
