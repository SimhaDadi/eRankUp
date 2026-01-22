#!/bin/bash

# Integration Test Script for eRankUp
# Tests all major features end-to-end

set -e  # Exit on error

echo "🧪 eRankUp Integration Test Suite"
echo "=================================="
echo ""

# Configuration
API_URL="http://localhost:3000"
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="Test123!"
TEST_NAME="Test User"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((TESTS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((TESTS_FAILED++))
}

info() {
    echo -e "${YELLOW}ℹ${NC} $1"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Install with: sudo apt-get install jq"
    exit 1
fi

echo "Step 1: Testing User Signup"
echo "----------------------------"

SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"fullName\":\"$TEST_NAME\"}")

if echo "$SIGNUP_RESPONSE" | jq -e '.access_token' > /dev/null 2>&1; then
    TOKEN=$(echo "$SIGNUP_RESPONSE" | jq -r '.access_token')
    USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id')
    pass "User signup successful"
    info "User ID: $USER_ID"
else
    fail "User signup failed"
    echo "Response: $SIGNUP_RESPONSE"
    exit 1
fi

echo ""
echo "Step 2: Testing Gamification Profile Creation"
echo "----------------------------------------------"

PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/gamification/profile" \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | jq -e '.userId' > /dev/null 2>&1; then
    TOTAL_XP=$(echo "$PROFILE_RESPONSE" | jq -r '.totalXp')
    LEVEL=$(echo "$PROFILE_RESPONSE" | jq -r '.level')
    pass "Gamification profile exists"
    info "Initial XP: $TOTAL_XP, Level: $LEVEL"
    
    if [ "$TOTAL_XP" -eq 0 ] && [ "$LEVEL" -eq 1 ]; then
        pass "Profile initialized with correct defaults"
    else
        fail "Profile has incorrect initial values"
    fi
else
    fail "Gamification profile not created"
    echo "Response: $PROFILE_RESPONSE"
fi

echo ""
echo "Step 3: Testing AI Chat"
echo "-----------------------"

CHAT_RESPONSE=$(curl -s -X POST "$API_URL/ai-chat/message" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me with math?"}')

if echo "$CHAT_RESPONSE" | jq -e '.response' > /dev/null 2>&1; then
    CONVERSATION_ID=$(echo "$CHAT_RESPONSE" | jq -r '.conversationId')
    AI_RESPONSE=$(echo "$CHAT_RESPONSE" | jq -r '.response' | head -c 50)
    pass "AI chat responded"
    info "Conversation ID: $CONVERSATION_ID"
    info "Response preview: $AI_RESPONSE..."
else
    fail "AI chat failed"
    echo "Response: $CHAT_RESPONSE"
fi

echo ""
echo "Step 4: Testing Conversation History"
echo "------------------------------------"

if [ -n "$CONVERSATION_ID" ]; then
    HISTORY_RESPONSE=$(curl -s -X GET "$API_URL/ai-chat/conversation/$CONVERSATION_ID" \
      -H "Authorization: Bearer $TOKEN")
    
    MESSAGE_COUNT=$(echo "$HISTORY_RESPONSE" | jq '. | length')
    if [ "$MESSAGE_COUNT" -ge 2 ]; then
        pass "Conversation history saved (${MESSAGE_COUNT} messages)"
    else
        fail "Conversation history incomplete"
    fi
fi

echo ""
echo "Step 5: Testing Leaderboard"
echo "---------------------------"

LEADERBOARD_RESPONSE=$(curl -s -X GET "$API_URL/gamification/leaderboard" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LEADERBOARD_RESPONSE" | jq -e '. | length' > /dev/null 2>&1; then
    LEADERBOARD_COUNT=$(echo "$LEADERBOARD_RESPONSE" | jq '. | length')
    pass "Leaderboard retrieved (${LEADERBOARD_COUNT} users)"
else
    fail "Leaderboard failed"
fi

echo ""
echo "Step 6: Testing Adaptive Learning Endpoints"
echo "-------------------------------------------"

# Test mastery endpoint
MASTERY_RESPONSE=$(curl -s -X GET "$API_URL/adaptive/mastery" \
  -H "Authorization: Bearer $TOKEN")

if echo "$MASTERY_RESPONSE" | jq -e '.topics' > /dev/null 2>&1; then
    pass "Mastery endpoint accessible"
else
    fail "Mastery endpoint failed"
fi

# Test weak areas endpoint
WEAK_AREAS_RESPONSE=$(curl -s -X GET "$API_URL/adaptive/weak-areas?limit=5" \
  -H "Authorization: Bearer $TOKEN")

if echo "$WEAK_AREAS_RESPONSE" | jq -e '. | type' > /dev/null 2>&1; then
    pass "Weak areas endpoint accessible"
else
    fail "Weak areas endpoint failed"
fi

# Test learning path endpoint
LEARNING_PATH_RESPONSE=$(curl -s -X GET "$API_URL/adaptive/learning-path" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LEARNING_PATH_RESPONSE" | jq -e '.recommendedTopics' > /dev/null 2>&1; then
    pass "Learning path endpoint accessible"
else
    fail "Learning path endpoint failed"
fi

echo ""
echo "Step 7: Testing Daily Challenge"
echo "-------------------------------"

CHALLENGE_RESPONSE=$(curl -s -X GET "$API_URL/gamification/daily-challenge" \
  -H "Authorization: Bearer $TOKEN")

if echo "$CHALLENGE_RESPONSE" | jq -e '.id' > /dev/null 2>&1; then
    CHALLENGE_DESC=$(echo "$CHALLENGE_RESPONSE" | jq -r '.description')
    pass "Daily challenge retrieved"
    info "Challenge: $CHALLENGE_DESC"
else
    fail "Daily challenge failed"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
