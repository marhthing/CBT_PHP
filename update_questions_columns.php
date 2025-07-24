
<?php
require_once 'config/db.php';

try {
    $db = new Database();
    
    // Check if columns already exist
    $checkQuery = "SELECT column_name FROM information_schema.columns 
                   WHERE table_name = 'questions' AND column_name IN ('edited_by', 'edited_at')";
    $existingColumns = $db->fetchAll($checkQuery);
    
    if (count($existingColumns) < 2) {
        echo "Adding missing columns to questions table...\n";
        
        // Add the columns
        $alterQuery = "ALTER TABLE questions 
                       ADD COLUMN IF NOT EXISTS edited_by INT DEFAULT NULL,
                       ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP NULL DEFAULT NULL";
        $db->execute($alterQuery);
        
        // Add foreign key constraint
        $fkQuery = "ALTER TABLE questions 
                    ADD CONSTRAINT fk_questions_edited_by 
                    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL";
        
        try {
            $db->execute($fkQuery);
        } catch (Exception $e) {
            // Foreign key might already exist, ignore this error
            echo "Foreign key constraint may already exist: " . $e->getMessage() . "\n";
        }
        
        echo "Questions table updated successfully!\n";
    } else {
        echo "Columns already exist in questions table.\n";
    }
    
} catch (Exception $e) {
    echo "Error updating questions table: " . $e->getMessage() . "\n";
}
?>
