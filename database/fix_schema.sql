-- Fix column names to match SQLAlchemy models
USE bank_app;

-- Fix users table: rename is_verified to email_verified
ALTER TABLE users CHANGE COLUMN is_verified email_verified BOOLEAN DEFAULT FALSE;

-- Fix audit_logs table: rename table_name to entity_type, record_id to entity_id
ALTER TABLE audit_logs CHANGE COLUMN table_name entity_type VARCHAR(100);
ALTER TABLE audit_logs CHANGE COLUMN record_id entity_id INT;
-- Also need to add description column if missing
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS description TEXT;

SELECT 'Schema fixes applied successfully!' AS Status;
