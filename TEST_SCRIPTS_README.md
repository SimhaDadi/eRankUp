# Test Scripts - Usage Guide

## Overview
This directory contains comprehensive test scripts for all eRankUp features.

---

## 1. Unit Tests

### Run All Unit Tests
```bash
cd backend
npm test
```

### Run Specific Test Files
```bash
# Test Gamification Service
npm test -- gamification.service.spec.ts

# Test Adaptive Learning Service
npm test -- adaptive-learning.service.spec.ts

# Watch mode (re-runs on file changes)
npm test -- --watch
```

### Test Coverage
```bash
npm test -- --coverage
```

---

## 2. Integration Tests

### Prerequisites
- Backend must be running on `http://localhost:3000`
- Database must be accessible
- `jq` must be installed (for JSON parsing)

### Install jq
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (Git Bash)
# Download from https://stedolan.github.io/jq/download/
```

### Run Integration Tests
```bash
# Make script executable
chmod +x test-integration.sh

# Run tests
./test-integration.sh
```

### What It Tests
- ✅ User signup
- ✅ Gamification profile creation
- ✅ AI chat functionality
- ✅ Conversation history
- ✅ Leaderboard
- ✅ Adaptive learning endpoints
- ✅ Daily challenges

### Expected Output
```
🧪 eRankUp Integration Test Suite
==================================

Step 1: Testing User Signup
----------------------------
✓ User signup successful
ℹ User ID: abc-123-def

Step 2: Testing Gamification Profile Creation
----------------------------------------------
✓ Gamification profile exists
ℹ Initial XP: 0, Level: 1
✓ Profile initialized with correct defaults

...

=========================================
Test Summary
=========================================
Tests Passed: 12
Tests Failed: 0

✓ All tests passed!
```

---

## 3. Database Verification

### Run Verification Queries
```bash
# Connect to PostgreSQL
psql -U admin -d erankup_db

# Run all verification queries
\i verify-database.sql

# Or run specific sections
psql -U admin -d erankup_db < verify-database.sql
```

### What It Checks

**Gamification:**
- Total profiles created
- XP distribution
- Streak distribution
- Badges earned

**Adaptive Learning:**
- Topic mastery records
- Average mastery by topic
- Users with weak areas
- Learning paths generated

**AI Chat:**
- Total conversations/messages
- Active users
- Recent conversations
- Context usage

**Integration:**
- XP awarded after tests
- Mastery updated after tests

**Data Quality:**
- Orphaned records
- Missing profiles
- Index usage

### Sample Queries

**Check Gamification Status:**
```sql
SELECT 
    COUNT(*) as total_users,
    AVG("totalXp") as avg_xp,
    AVG("level") as avg_level,
    AVG("currentStreak") as avg_streak
FROM user_gamification;
```

**Find Top Performers:**
```sql
SELECT 
    u."fullName",
    ug."totalXp",
    ug."level",
    jsonb_array_length(ug.badges) as badges
FROM user_gamification ug
JOIN "user" u ON ug."userId" = u.id
ORDER BY ug."totalXp" DESC
LIMIT 10;
```

---

## 4. Manual Testing Checklist

### Complete User Flow Test

1. **Sign Up**
   - Navigate to `/signup`
   - Create account
   - Verify email/password validation

2. **First Test**
   - Login
   - Start practice test
   - Answer 15/20 questions correctly
   - Submit test

3. **Verify Gamification**
   - Check backend console: `[Scorer] Awarded 200 XP`
   - Navigate to `/badges`
   - Verify "First Steps" badge earned
   - Navigate to `/leaderboard`
   - Verify you appear in list

4. **Verify Adaptive Learning**
   - Run query:
   ```sql
   SELECT * FROM user_topic_mastery WHERE "userId" = 'your-id';
   ```
   - Should show topics with mastery scores

5. **Test AI Chat**
   - Navigate to `/ai-study`
   - Ask: "What are my weak areas?"
   - Verify AI mentions topics from test
   - Ask follow-up question
   - Verify context maintained

6. **Test Multi-Language**
   - Switch to Hindi
   - Verify UI updates
   - Refresh page
   - Verify language persists

---

## 5. Performance Testing

### Load Test Endpoints

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Ubuntu
brew install httpd                   # macOS

# Test leaderboard (1000 requests, 10 concurrent)
ab -n 1000 -c 10 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/gamification/leaderboard

# Test AI chat (100 requests, 5 concurrent)
ab -n 100 -c 5 \
  -p chat-payload.json \
  -T application/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/ai-chat/message
```

### Expected Performance
- Leaderboard: <100ms average
- AI Chat: 2-5s average (Gemini API latency)
- Mastery endpoints: <50ms average

---

## 6. Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          npm test
```

---

## 7. Troubleshooting

### Tests Failing?

**Check Backend is Running:**
```bash
curl http://localhost:3000/health
```

**Check Database Connection:**
```bash
psql -U admin -d erankup_db -c "SELECT 1;"
```

**Check Migrations:**
```bash
cd backend
npm run migration:run
```

**View Test Logs:**
```bash
# Backend logs
tail -f backend/logs/error.log

# Test output
npm test -- --verbose
```

---

## 8. Test Data Cleanup

### Reset Test Data
```sql
-- Delete test users
DELETE FROM "user" WHERE email LIKE 'test%@example.com';

-- This will cascade delete:
-- - user_gamification
-- - user_topic_mastery
-- - chat_conversation
-- - chat_message
-- - attempt
-- - response
```

### Seed Fresh Data
```bash
cd backend
npm run seed
```

---

## Quick Reference

```bash
# Run all tests
npm test                          # Unit tests
./test-integration.sh             # Integration tests
psql -f verify-database.sql       # Database checks

# Run specific tests
npm test -- gamification          # Gamification only
npm test -- adaptive              # Adaptive learning only

# Watch mode
npm test -- --watch               # Auto-rerun on changes

# Coverage
npm test -- --coverage            # Generate coverage report
```

---

## Success Criteria

All tests should pass with:
- ✅ 0 failed unit tests
- ✅ 0 failed integration tests
- ✅ 0 orphaned database records
- ✅ <100ms API response times (except AI chat)
- ✅ 100% feature adoption for test users

---

**Ready to test!** Start with unit tests, then integration tests, then database verification. 🧪
