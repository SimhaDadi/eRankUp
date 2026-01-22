-- Database Verification Queries for eRankUp
-- Run these queries to verify all features are working correctly

-- ============================================
-- 1. GAMIFICATION VERIFICATION
-- ============================================

-- Check if gamification profiles exist
SELECT COUNT(*) as total_profiles FROM user_gamification;

-- View top 10 users by XP
SELECT 
    ug."userId",
    u."fullName",
    ug."totalXp",
    ug."level",
    ug."currentStreak",
    ug."longestStreak",
    jsonb_array_length(ug.badges) as badge_count
FROM user_gamification ug
JOIN "user" u ON ug."userId" = u.id
ORDER BY ug."totalXp" DESC
LIMIT 10;

-- Check XP distribution
SELECT 
    CASE 
        WHEN "totalXp" < 100 THEN '0-100'
        WHEN "totalXp" < 500 THEN '100-500'
        WHEN "totalXp" < 1000 THEN '500-1000'
        WHEN "totalXp" < 5000 THEN '1000-5000'
        ELSE '5000+'
    END as xp_range,
    COUNT(*) as user_count
FROM user_gamification
GROUP BY xp_range
ORDER BY MIN("totalXp");

-- Check streak distribution
SELECT 
    "currentStreak",
    COUNT(*) as user_count
FROM user_gamification
GROUP BY "currentStreak"
ORDER BY "currentStreak" DESC;

-- View badges earned
SELECT 
    badge->>'id' as badge_id,
    badge->>'name' as badge_name,
    COUNT(*) as times_earned
FROM user_gamification,
jsonb_array_elements(badges) as badge
GROUP BY badge->>'id', badge->>'name'
ORDER BY times_earned DESC;

-- ============================================
-- 2. ADAPTIVE LEARNING VERIFICATION
-- ============================================

-- Check topic mastery records
SELECT COUNT(*) as total_mastery_records FROM user_topic_mastery;

-- View average mastery by topic
SELECT 
    topic,
    COUNT(DISTINCT "userId") as user_count,
    ROUND(AVG("masteryScore")::numeric, 2) as avg_mastery,
    SUM("totalAttempts") as total_attempts,
    SUM("correctAttempts") as total_correct
FROM user_topic_mastery
GROUP BY topic
ORDER BY avg_mastery ASC;

-- Find users with weak areas (mastery < 0.5)
SELECT 
    utm."userId",
    u."fullName",
    utm.topic,
    ROUND(utm."masteryScore"::numeric, 2) as mastery,
    utm."totalAttempts",
    utm."correctAttempts"
FROM user_topic_mastery utm
JOIN "user" u ON utm."userId" = u.id
WHERE utm."masteryScore" < 0.5
ORDER BY utm."masteryScore" ASC
LIMIT 20;

-- Check learning paths generated
SELECT 
    lp."userId",
    u."fullName",
    jsonb_array_length(lp."recommendedTopics") as recommended_count,
    jsonb_array_length(lp."weakAreas") as weak_count,
    jsonb_array_length(lp."strongAreas") as strong_count,
    lp."generatedAt"
FROM learning_path lp
JOIN "user" u ON lp."userId" = u.id
ORDER BY lp."generatedAt" DESC
LIMIT 10;

-- ============================================
-- 3. AI CHAT VERIFICATION
-- ============================================

-- Check total conversations and messages
SELECT 
    (SELECT COUNT(*) FROM chat_conversation) as total_conversations,
    (SELECT COUNT(*) FROM chat_message) as total_messages,
    (SELECT COUNT(DISTINCT "userId") FROM chat_conversation) as active_users;

-- View conversation statistics
SELECT 
    cc."userId",
    u."fullName",
    COUNT(DISTINCT cc.id) as conversation_count,
    COUNT(cm.id) as message_count,
    MAX(cm."createdAt") as last_message_at
FROM chat_conversation cc
JOIN "user" u ON cc."userId" = u.id
LEFT JOIN chat_message cm ON cc.id = cm."conversationId"
GROUP BY cc."userId", u."fullName"
ORDER BY message_count DESC
LIMIT 10;

-- View recent conversations
SELECT 
    cc.id,
    cc.title,
    u."fullName",
    COUNT(cm.id) as message_count,
    cc."createdAt",
    cc."updatedAt"
FROM chat_conversation cc
JOIN "user" u ON cc."userId" = u.id
LEFT JOIN chat_message cm ON cc.id = cm."conversationId"
GROUP BY cc.id, cc.title, u."fullName", cc."createdAt", cc."updatedAt"
ORDER BY cc."updatedAt" DESC
LIMIT 10;

-- Check if AI responses include context
SELECT 
    cm.id,
    cm.role,
    LEFT(cm.content, 100) as content_preview,
    cm.context->>'weakAreas' as weak_areas_context
FROM chat_message cm
WHERE cm.role = 'user' AND cm.context IS NOT NULL
LIMIT 10;

-- ============================================
-- 4. INTEGRATION VERIFICATION
-- ============================================

-- Check if XP is being awarded after tests
SELECT 
    a.id as attempt_id,
    a."userId",
    u."fullName",
    a.score,
    a."correctAnswers",
    a."totalQuestions",
    a."createdAt" as test_completed_at,
    ug."totalXp",
    ug."level"
FROM attempt a
JOIN "user" u ON a."userId" = u.id
LEFT JOIN user_gamification ug ON a."userId" = ug."userId"
ORDER BY a."createdAt" DESC
LIMIT 10;

-- Verify mastery is updated after tests
SELECT 
    a.id as attempt_id,
    a."userId",
    a."createdAt" as test_completed_at,
    COUNT(r.id) as response_count,
    COUNT(DISTINCT r."questionId") as unique_questions,
    COUNT(DISTINCT utm.topic) as topics_tracked
FROM attempt a
LEFT JOIN response r ON a.id = r."attemptId"
LEFT JOIN question q ON r."questionId" = q.id
LEFT JOIN user_topic_mastery utm ON a."userId" = utm."userId" AND q.topic = utm.topic
WHERE a."createdAt" > NOW() - INTERVAL '7 days'
GROUP BY a.id, a."userId", a."createdAt"
ORDER BY a."createdAt" DESC
LIMIT 10;

-- ============================================
-- 5. PERFORMANCE CHECKS
-- ============================================

-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- ============================================
-- 6. DATA QUALITY CHECKS
-- ============================================

-- Find users without gamification profiles (should be 0)
SELECT 
    u.id,
    u."fullName",
    u."createdAt"
FROM "user" u
LEFT JOIN user_gamification ug ON u.id = ug."userId"
WHERE ug.id IS NULL;

-- Find orphaned mastery records (should be 0)
SELECT 
    utm.id,
    utm."userId",
    utm.topic
FROM user_topic_mastery utm
LEFT JOIN "user" u ON utm."userId" = u.id
WHERE u.id IS NULL;

-- Find orphaned chat messages (should be 0)
SELECT 
    cm.id,
    cm."conversationId"
FROM chat_message cm
LEFT JOIN chat_conversation cc ON cm."conversationId" = cc.id
WHERE cc.id IS NULL;

-- ============================================
-- 7. FEATURE ADOPTION METRICS
-- ============================================

-- Gamification adoption
SELECT 
    'Users with XP > 0' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_gamification), 2) as percentage
FROM user_gamification
WHERE "totalXp" > 0
UNION ALL
SELECT 
    'Users with badges' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_gamification), 2) as percentage
FROM user_gamification
WHERE jsonb_array_length(badges) > 0
UNION ALL
SELECT 
    'Users with streaks' as metric,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_gamification), 2) as percentage
FROM user_gamification
WHERE "currentStreak" > 0;

-- AI Chat adoption
SELECT 
    'Users who chatted' as metric,
    COUNT(DISTINCT "userId") as count,
    ROUND(COUNT(DISTINCT "userId") * 100.0 / (SELECT COUNT(*) FROM "user"), 2) as percentage
FROM chat_conversation;

-- Adaptive Learning adoption
SELECT 
    'Users with mastery data' as metric,
    COUNT(DISTINCT "userId") as count,
    ROUND(COUNT(DISTINCT "userId") * 100.0 / (SELECT COUNT(*) FROM "user"), 2) as percentage
FROM user_topic_mastery;
