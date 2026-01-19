-- Sample seed data for testing
USE note_taking_db;

-- Note: Passwords are hashed version of 'password123'
-- You should use the API to create users to get proper password hashing

-- Sample queries to test after seeding via API:

-- 1. Get all notes for a user
-- SELECT * FROM notes WHERE user_id = 1 AND deleted_at IS NULL;

-- 2. Search notes
-- SELECT *, MATCH(title, content) AGAINST('javascript' IN NATURAL LANGUAGE MODE) as relevance
-- FROM notes
-- WHERE user_id = 1 AND deleted_at IS NULL
--   AND MATCH(title, content) AGAINST('javascript' IN NATURAL LANGUAGE MODE)
-- ORDER BY relevance DESC;

-- 3. Get note versions
-- SELECT * FROM note_versions WHERE note_id = 1 ORDER BY version_number DESC;

-- 4. Check soft deleted notes
-- SELECT * FROM notes WHERE deleted_at IS NOT NULL;

-- 5. User statistics
-- SELECT 
--   u.username,
--   COUNT(DISTINCT n.id) as total_notes,
--   COUNT(DISTINCT nv.id) as total_versions,
--   COUNT(DISTINCT CASE WHEN n.deleted_at IS NOT NULL THEN n.id END) as deleted_notes
-- FROM users u
-- LEFT JOIN notes n ON u.id = n.user_id
-- LEFT JOIN note_versions nv ON n.id = nv.note_id
-- GROUP BY u.id;

