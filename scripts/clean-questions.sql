-- Clean Database Script: Delete All Sample Questions
-- Purpose: Remove all test/sample questions for clean manual testing
-- WARNING: This will delete ALL questions and related data!

-- Step 1: Delete all responses (user answers to questions)
DELETE FROM response;

-- Step 2: Delete junction table entries (question-exam relationships)
DELETE FROM exam_questions_question;

-- Step 3: Delete junction table entries (question-model relationships)
DELETE FROM model_questions;

-- Step 4: Delete question explanations
DELETE FROM question_explanation;

-- Step 5: Delete all questions
DELETE FROM question;

-- Verify deletion
SELECT 'Questions' as table_name, COUNT(*) as count FROM question
UNION ALL SELECT 'Responses', COUNT(*) FROM response
UNION ALL SELECT 'Exam-Question Links', COUNT(*) FROM exam_questions_question
UNION ALL SELECT 'Model-Question Links', COUNT(*) FROM model_questions
UNION ALL SELECT 'Question Explanations', COUNT(*) FROM question_explanation;

-- Expected output: All counts should be 0

