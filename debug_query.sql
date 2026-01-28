-- Check Model Questions Junction Table for RRB NTPC
SELECT 
    m.id as model_id, 
    m.title as model_title, 
    (SELECT COUNT(*) FROM model_questions mq WHERE mq."modelId" = m.id) as linked_questions_count
FROM model m 
WHERE m.title LIKE '%RRB NTPC%';

-- Check Questions table directly for the same Exam/Content
-- We need to see if questions EXIST but aren't LINKED
SELECT COUNT(*) as total_questions_with_exam_id
FROM question q
WHERE q."examId" = '8093fae9-dce4-420b-82a1-751f46e0b553';

-- Check if they are linked to any model at all via junction table
SELECT COUNT(*) as questions_in_exam_rel_but_no_model
FROM question q
LEFT JOIN model_questions mq ON mq."questionId" = q.id
WHERE q."examId" = '8093fae9-dce4-420b-82a1-751f46e0b553' AND mq."modelId" IS NULL;
