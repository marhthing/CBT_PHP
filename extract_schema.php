
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
        
        // First, extract schema only for all tables
        $schema_command = sprintf(
            'pg_dump --host=%s --port=%s --username=%s --dbname=%s --schema-only --no-owner --no-privileges --clean --if-exists',
            escapeshellarg($host),
            escapeshellarg($port),
            escapeshellarg($username),
            escapeshellarg($db_name)
        );
        
        echo "Extracting database schema...\n";
        echo "Running: $schema_command\n\n";
        
        // Execute schema dump
        $schema_output = [];
        $return_code = 0;
        exec($schema_command . ' 2>&1', $schema_output, $return_code);
        
        if ($return_code !== 0) {
            echo "Error running schema dump (return code: $return_code):\n";
            echo implode("\n", $schema_output) . "\n";
            return false;
        }
        
        // Tables to extract data for
        $data_tables = ['users', 'class_levels', 'sessions', 'terms'];
        $data_content = '';
        
        // Extract data for specified tables
        foreach ($data_tables as $table) {
            $data_command = sprintf(
                'pg_dump --host=%s --port=%s --username=%s --dbname=%s --data-only --no-owner --no-privileges --table=%s',
                escapeshellarg($host),
                escapeshellarg($port),
                escapeshellarg($username),
                escapeshellarg($db_name),
                escapeshellarg($table)
            );
            
            echo "Extracting $table table data...\n";
            echo "Running: $data_command\n\n";
            
            // Execute data dump for this table
            $table_data_output = [];
            $return_code = 0;
            exec($data_command . ' 2>&1', $table_data_output, $return_code);
            
            if ($return_code !== 0) {
                echo "Warning: Error extracting data for table $table (return code: $return_code):\n";
                echo implode("\n", $table_data_output) . "\n";
                continue; // Continue with other tables
            }
            
            $table_data_content = implode("\n", $table_data_output);
            if (!empty($table_data_content) && trim($table_data_content) !== '') {
                $data_content .= "\n\n--\n-- Data for Name: $table; Type: TABLE DATA; Schema: public; Owner: -\n--\n\n";
                $data_content .= $table_data_content;
            }
        }
        
        // Combine schema and data
        $schema_content = implode("\n", $schema_output);
        
        // Add header comment
        $header = "-- PostgreSQL Database Schema for CBT Portal\n";
        $header .= "-- Generated: " . date('F j, Y \a\t g:i A') . "\n";
        $header .= "-- Extracted from database: $db_name\n";
        $header .= "-- Structure: All tables\n";
        $header .= "-- Data: " . implode(', ', $data_tables) . " tables only\n\n";
        
        // Combine everything
        $full_schema = $header . $schema_content;
        
        // Add data if we have any
        if (!empty($data_content) && trim($data_content) !== '') {
            $full_schema .= $data_content;
        }
        
        // Write to schema.sql file
        $bytes_written = file_put_contents('schema.sql', $full_schema);
        
        if ($bytes_written === false) {
            echo "Error: Could not write to schema.sql file\n";
            return false;
        }
        
        echo "✅ Schema successfully extracted to schema.sql\n";
        echo "File size: " . number_format($bytes_written) . " bytes\n";
        
        // Show summary of extracted objects
        $schema_lines = explode("\n", $schema_content);
        $data_lines = explode("\n", $data_content);
        $tables = 0;
        $indexes = 0;
        $constraints = 0;
        $data_rows = 0;
        
        foreach ($schema_lines as $line) {
            if (preg_match('/^CREATE TABLE/', $line)) {
                $tables++;
            } elseif (preg_match('/^CREATE.*INDEX/', $line)) {
                $indexes++;
            } elseif (preg_match('/ADD CONSTRAINT/', $line)) {
                $constraints++;
            }
        }
        
        // Count INSERT statements for data
        foreach ($data_lines as $line) {
            if (preg_match('/^INSERT INTO/', $line)) {
                $data_rows++;
            }
        }
        
        echo "\nSummary:\n";
        echo "- Tables (structure): $tables\n";
        echo "- Indexes: $indexes\n";
        echo "- Constraints: $constraints\n";
        echo "- Data tables with content: " . implode(', ', $data_tables) . "\n";
        echo "- Total data INSERT statements: $data_rows\n";
        
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
