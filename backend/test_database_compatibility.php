<?php
/**
 * Database Compatibility Test Script
 * 
 * This script tests all database compatibility features to ensure
 * the CBT system works correctly with both MySQL and PostgreSQL.
 */

require_once 'config/database.php';
require_once 'includes/response.php';

function runCompatibilityTests() {
    $results = [
        'database_type' => null,
        'connection_test' => false,
        'compatibility_methods' => [],
        'query_tests' => [],
        'overall_status' => 'FAILED'
    ];
    
    try {
        // Test 1: Database Connection
        echo "🔌 Testing database connection...\n";
        $database = new Database();
        $db = $database->getConnection();
        $results['database_type'] = $database->getDatabaseType();
        $results['connection_test'] = $database->isConnected();
        
        if (!$results['connection_test']) {
            throw new Exception("Database connection failed");
        }
        
        echo "✅ Connected to {$results['database_type']} successfully!\n\n";
        
        // Test 2: Compatibility Methods
        echo "🧪 Testing compatibility methods...\n";
        
        $methods_to_test = [
            'getRandomOrder' => $database->getRandomOrder(),
            'getCurrentDate' => $database->getCurrentDate(),
            'dateSubDays' => $database->dateSubDays(7),
            'getCaseInsensitiveLike' => $database->getCaseInsensitiveLike(),
            'castAsDecimal' => $database->castAsDecimal('test_column'),
            'getBooleanTrue' => $database->getBooleanTrue(),
            'getBooleanFalse' => $database->getBooleanFalse(),
            'concat' => $database->concat(["'test'", "' '", "'string'"])
        ];
        
        foreach ($methods_to_test as $method => $result) {
            $results['compatibility_methods'][$method] = $result;
            echo "  ✅ {$method}(): {$result}\n";
        }
        
        echo "\n";
        
        // Test 3: Query Tests
        echo "📊 Testing database queries...\n";
        
        // Test basic query
        $test_query = "SELECT 1 as test_value";
        $stmt = $db->prepare($test_query);
        $stmt->execute();
        $test_result = $stmt->fetch();
        $results['query_tests']['basic_select'] = $test_result ? 'PASSED' : 'FAILED';
        echo "  ✅ Basic SELECT query: {$results['query_tests']['basic_select']}\n";
        
        // Test date function
        $date_query = "SELECT {$database->getCurrentDate()} as current_date";
        $stmt = $db->prepare($date_query);
        $stmt->execute();
        $date_result = $stmt->fetch();
        $results['query_tests']['date_function'] = $date_result ? 'PASSED' : 'FAILED';
        echo "  ✅ Date function query: {$results['query_tests']['date_function']}\n";
        
        // Test table existence (check main tables)
        $tables_to_check = ['users', 'subjects', 'questions', 'test_codes'];
        $table_check_results = [];
        
        foreach ($tables_to_check as $table) {
            try {
                $check_query = "SELECT COUNT(*) as count FROM {$table} LIMIT 1";
                $stmt = $db->prepare($check_query);
                $stmt->execute();
                $table_result = $stmt->fetch();
                $table_check_results[$table] = 'EXISTS';
                echo "  ✅ Table '{$table}': EXISTS\n";
            } catch (Exception $e) {
                $table_check_results[$table] = 'MISSING';
                echo "  ❌ Table '{$table}': MISSING\n";
            }
        }
        
        $results['query_tests']['table_checks'] = $table_check_results;
        
        // Test 4: Authentication Test
        echo "\n🔐 Testing authentication system...\n";
        
        try {
            $auth_query = "SELECT id, username, role FROM users WHERE role = 'admin' LIMIT 1";
            $stmt = $db->prepare($auth_query);
            $stmt->execute();
            $admin_user = $stmt->fetch();
            
            if ($admin_user) {
                $results['query_tests']['admin_user_exists'] = 'PASSED';
                echo "  ✅ Admin user found: {$admin_user['username']}\n";
            } else {
                $results['query_tests']['admin_user_exists'] = 'FAILED';
                echo "  ❌ No admin user found\n";
            }
        } catch (Exception $e) {
            $results['query_tests']['admin_user_exists'] = 'ERROR';
            echo "  ❌ Admin user check error: " . $e->getMessage() . "\n";
        }
        
        // Overall assessment
        $failed_tests = 0;
        foreach ($results['query_tests'] as $test => $result) {
            if (is_array($result)) {
                foreach ($result as $sub_result) {
                    if ($sub_result !== 'EXISTS' && $sub_result !== 'PASSED') {
                        $failed_tests++;
                    }
                }
            } else if ($result !== 'PASSED') {
                $failed_tests++;
            }
        }
        
        if ($failed_tests === 0) {
            $results['overall_status'] = 'PASSED';
            echo "\n🎉 All tests PASSED! Database compatibility is working perfectly.\n";
        } else {
            $results['overall_status'] = 'PARTIAL';
            echo "\n⚠️  Some tests failed. Database is functional but may need attention.\n";
        }
        
    } catch (Exception $e) {
        $results['overall_status'] = 'FAILED';
        echo "\n❌ Test suite failed: " . $e->getMessage() . "\n";
    }
    
    return $results;
}

function displayCompatibilityInfo() {
    echo "\n" . str_repeat("=", 60) . "\n";
    echo "          CBT PORTAL DATABASE COMPATIBILITY TEST\n";
    echo str_repeat("=", 60) . "\n\n";
    
    $results = runCompatibilityTests();
    
    echo "\n" . str_repeat("-", 60) . "\n";
    echo "SUMMARY:\n";
    echo str_repeat("-", 60) . "\n";
    echo "Database Type: " . ($results['database_type'] ?? 'Unknown') . "\n";
    echo "Connection: " . ($results['connection_test'] ? 'SUCCESS' : 'FAILED') . "\n";
    echo "Overall Status: " . $results['overall_status'] . "\n";
    
    if ($results['overall_status'] === 'PASSED') {
        echo "\n✅ Your CBT Portal is ready for production!\n";
        echo "Both frontend (port 5000) and backend (port 8000) should work correctly.\n";
        echo "Test login: username=admin, password=admin123\n";
    } else if ($results['overall_status'] === 'PARTIAL') {
        echo "\n⚠️  Your CBT Portal is mostly functional but may need some setup.\n";
        echo "Check the failed tests above and ensure all tables are created.\n";
    } else {
        echo "\n❌ Your CBT Portal needs configuration.\n";
        echo "Please check your database connection settings and try again.\n";
    }
    
    echo "\nFor detailed compatibility information, see: DATABASE_COMPATIBILITY.md\n";
    echo str_repeat("=", 60) . "\n";
    
    return $results;
}

// Run the tests if called directly
if (php_sapi_name() === 'cli') {
    displayCompatibilityInfo();
} else {
    // Web interface
    header('Content-Type: application/json');
    echo json_encode(displayCompatibilityInfo(), JSON_PRETTY_PRINT);
}

?>