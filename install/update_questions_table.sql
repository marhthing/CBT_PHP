
-- Add columns for tracking question edits
ALTER TABLE questions 
ADD COLUMN edited_by INT DEFAULT NULL,
ADD COLUMN edited_at TIMESTAMP NULL DEFAULT NULL,
ADD FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL;
