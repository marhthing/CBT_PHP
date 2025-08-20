# Database Compatibility Guide

The CBT Portal has been designed with complete compatibility for both **MySQL** and **PostgreSQL** databases. The system automatically detects which database type you're using and adapts all queries accordingly.

## Supported Database Systems

### ✅ MySQL (5.7+)
- Full compatibility with MySQL 5.7 and higher
- Optimized for shared hosting environments (cPanel, InfinityFree, 000webhost, etc.)
- Uses MySQL-specific syntax: `RAND()`, `DATE_SUB()`, `CURDATE()`, `LIMIT offset, limit`
- Perfect for traditional web hosting services

### ✅ PostgreSQL (12+)  
- Full compatibility with PostgreSQL 12 and higher
- Optimized for cloud platforms (Neon, Supabase, Railway, etc.)
- Uses PostgreSQL-specific syntax: `RANDOM()`, `INTERVAL`, `CURRENT_DATE`, `LIMIT limit OFFSET offset`
- Perfect for modern cloud deployments

## Automatic Database Detection

The system automatically detects your database type using these methods:

1. **Environment Variable**: Set `DB_TYPE=mysql` or `DB_TYPE=postgresql`
2. **Connection String**: Automatically detected from `DATABASE_URL` format
3. **Driver Detection**: PDO driver analysis for fallback detection

```php
// Example: Automatic detection
$database = new Database();
$db_type = $database->getDatabaseType(); // Returns 'mysql' or 'postgresql'
```

## Compatibility Features

### Query Syntax Adaptation
The system includes methods that automatically handle database differences:

```php
// Random ordering - works on both databases
$random_order = $database->getRandomOrder();
// MySQL: "RAND()" | PostgreSQL: "RANDOM()"

// Date operations - works on both databases  
$date_condition = $database->dateSubDays(7);
// MySQL: "DATE_SUB(NOW(), INTERVAL 7 DAY)"
// PostgreSQL: "NOW() - INTERVAL '7 days'"

// Current date - works on both databases
$current_date = $database->getCurrentDate();
// MySQL: "CURDATE()" | PostgreSQL: "CURRENT_DATE"

// Case-insensitive search - works on both databases
$like_operator = $database->getCaseInsensitiveLike();
// MySQL: "LIKE" | PostgreSQL: "ILIKE"

// Pagination - works on both databases
$paginated_query = $database->limitQuery($query, 20, 0);
// MySQL: "... LIMIT 0, 20" | PostgreSQL: "... LIMIT 20 OFFSET 0"
```

### Data Type Casting
```php
// Decimal casting - works on both databases
$decimal_field = $database->castAsDecimal('score');
// MySQL: "CAST(score AS DECIMAL)" | PostgreSQL: "score::decimal"

// Boolean values - works on both databases
$true_val = $database->getBooleanTrue();
$false_val = $database->getBooleanFalse();
// MySQL: "1"/"0" | PostgreSQL: "true"/"false"
```

### String Operations
```php
// String concatenation - works on both databases
$full_name = $database->concat(["first_name", "' '", "last_name"]);
// MySQL: "CONCAT(first_name, ' ', last_name)"
// PostgreSQL: "first_name || ' ' || last_name"
```

## Configuration Examples

### MySQL Configuration
```php
// For MySQL databases
$config = [
    'host' => 'localhost',
    'port' => 3306,
    'database' => 'cbt_portal',
    'username' => 'your_username',
    'password' => 'your_password',
    'type' => 'mysql' // Optional - auto-detected
];
```

### PostgreSQL Configuration  
```php
// For PostgreSQL databases
$config = [
    'host' => 'your-host.neon.tech',
    'port' => 5432,
    'database' => 'cbt_portal',
    'username' => 'your_username', 
    'password' => 'your_password',
    'type' => 'postgresql' // Optional - auto-detected
];
```

## Schema Compatibility

The system uses compatible SQL data types:

| Feature | MySQL | PostgreSQL |
|---------|-------|------------|
| Primary Keys | `INT AUTO_INCREMENT` | `SERIAL` |
| Text Fields | `TEXT`, `VARCHAR(255)` | `TEXT`, `VARCHAR(255)` |
| Dates | `DATETIME` | `TIMESTAMP` |
| Booleans | `TINYINT(1)` | `BOOLEAN` |
| JSON Data | `JSON` | `JSONB` |

## Performance Optimizations

Both database types include specific optimizations:

### MySQL Optimizations
- Uses `InnoDB` engine for better performance
- Implements `utf8mb4` charset for full UTF-8 support
- Includes MySQL-specific indexing strategies

### PostgreSQL Optimizations  
- Uses `JSONB` for better JSON performance
- Implements PostgreSQL-specific indexing
- Includes `VACUUM ANALYZE` for maintenance

## Testing Database Connection

```php
// Test your database connection
$result = testDatabaseConnection();

if ($result['success']) {
    echo "Connected to " . $result['database_type'] . " successfully!";
} else {
    echo "Connection failed: " . $result['message'];
}
```

## Migration Between Databases

If you need to switch database types:

1. **Export your data** from the current database
2. **Update your connection settings** to point to the new database
3. **Import your data** to the new database
4. **No code changes required** - the system adapts automatically!

## Environment Variables

The system respects these environment variables:

```bash
# Database connection
DATABASE_URL=postgresql://user:pass@host:port/db
# OR
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cbt_portal
DB_USER=username
DB_PASS=password
DB_TYPE=postgresql  # Optional override

# PostgreSQL specific
DB_SSLMODE=prefer   # prefer, require, disable
```

## Troubleshooting

### Common Issues

1. **"Database connection failed"**
   - Check your credentials and connection settings
   - Verify the database server is running

2. **"Unsupported database type"**  
   - Ensure you're using MySQL 5.7+ or PostgreSQL 12+
   - Check your PDO drivers are installed

3. **"SQL syntax error"**
   - This should never happen with the compatibility layer
   - If it does, please check the database detection is working

### Getting Help

The system includes comprehensive error reporting that will show:
- Which database type was detected
- What query failed (if any)
- Specific database error messages
- Suggestions for fixing common issues

## Conclusion

With this dual-database support, you can:
- ✅ Deploy on any hosting platform (shared or cloud)
- ✅ Switch databases without code changes  
- ✅ Use the best database for your specific needs
- ✅ Scale from shared hosting to enterprise cloud

The CBT Portal adapts to your infrastructure, not the other way around!