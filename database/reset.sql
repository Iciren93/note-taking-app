-- Clean all data (for testing purposes)
USE note_taking_db;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE note_versions;
TRUNCATE TABLE notes;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Database cleaned successfully' AS Status;

