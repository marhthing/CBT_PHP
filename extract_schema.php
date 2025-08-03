
<?php

require_once __DIR__ . '/backend/config/database.php';

function extractDatabaseSchema() {
    try {
        // Get database connection details
        $database = new Database();
        
        // Get environment variables
        $host = getenv('PGHOST') ?: ($_ENV['PGHOST'] ?? $_ENV['DATABASE_HOST'] ?? 'localhost');
        $db_name = getenv('PGDATABASE') ?: ($_ENV['PGDATABASE'] ?? $_ENV['DATABASE_NAME'] ?? 'cbt_portal');
        $username = getenv('PGUSER') ?: ($_ENV['PGUSER'] ?? $_ENV['DATABASE_USER'] ?? 'postgres');
        $password = getenv('PGPASSWORD') ?: ($_ENV['PGPASSWORD'] ?? $_ENV['DATABASE_PASSWORD'] ?? '');
        $port = getenv('PGPORT') ?: ($_ENV['PGPORT'] ?? $_ENV['DATABASE_PORT'] ?? '5432');
        
        echo "Extracting schema from database: $db_name\n";
        echo "Host: $host, Port: $port, User: $username\n\n";
        
        // Set PGPASSWORD environment variable for pg_dump
        putenv("PGPASSWORD=$password");
        
        // Build pg_dump command for schema only
        $command = sprintf(
            'pg_dump --host=%s --port=%s --username=%s --dbname=%s --schema-only --no-owner --no-privileges --clean --if-exists',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($db_name)
        );
        
        echo "Running: $command\n\n";
        
        // Execute pg_dump and capture output
        $output = [];
        $return_code = 0;
        exec($command . ' 2>&1', $output, $return_code);
        
        if ($return_code !== 0) {
            echo "Error running pg_dump (return code: $return_code):\n";
            echo implode("\n", $output) . "\n";
            return false;
        }
        
        // Join output and add header
        $schema_content = implode("\n", $output);
        
        // Add header comment
        $header = "-- PostgreSQL Database Schema for CBT Portal\n";
        $header .= "-- Generated: " . date('F j, Y \a\t g:i A') . "\n";
        $header .= "-- Extracted from database: $db_name\n\n";
        
        $full_schema = $header . $schema_content;
        
        // Write to schema.sql file
        $bytes_written = file_put_contents('schema.sql', $full_schema);
        
        if ($bytes_written === false) {
            echo "Error: Could not write to schema.sql file\n";
            return false;
        }
        
        echo "✅ Schema successfully extracted to schema.sql\n";
        echo "File size: " . number_format($bytes_written) . " bytes\n";
        
        // Show summary of extracted objects
        $lines = explode("\n", $schema_content);
        $tables = 0;
        $indexes = 0;
        $constraints = 0;
        
        foreach ($lines as $line) {
            if (preg_match('/^CREATE TABLE/', $line)) {
                $tables++;
            } elseif (preg_match('/^CREATE.*INDEX/', $line)) {
                $indexes++;
            } elseif (preg_match('/ADD CONSTRAINT/', $line)) {
                $constraints++;
            }
        }
        
        echo "\nSummary:\n";
        echo "- Tables: $tables\n";
        echo "- Indexes: $indexes\n";
        echo "- Constraints: $constraints\n";
        
        return true;
        
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        return false;
    }
}

// Run the extraction
echo "=== Database Schema Extraction ===\n\n";
$success = extractDatabaseSchema();

if ($success) {
    echo "\n=== Extraction Complete ===\n";
} else {
    echo "\n=== Extraction Failed ===\n";
    exit(1);
}

?>
