<?php
// Database configuration
declare(strict_types=1);

function envOrDefault(string $key, string $default): string
{
    $value = getenv($key);
    return ($value === false || $value === '') ? $default : $value;
}

// MySQL database credentials (Render: set these in Environment Variables)
define('DB_HOST', envOrDefault('DB_HOST', '127.0.0.1'));
define('DB_USER', envOrDefault('DB_USER', 'root'));
define('DB_PASSWORD', envOrDefault('DB_PASSWORD', ''));
define('DB_NAME', envOrDefault('DB_NAME', 'cyber_spin_wheel'));
define('DB_PORT', (int) envOrDefault('DB_PORT', '3306'));

// Create connection
function getDBConnection()
{
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

    // Check connection
    if ($conn->connect_error) {
        throw new RuntimeException('Database connection failed: ' . $conn->connect_error);
    }

    // Set charset
    $conn->set_charset("utf8mb4");
    return $conn;
}

// Close connection safely
function closeDBConnection($conn)
{
    if ($conn instanceof mysqli) {
        $conn->close();
    }
}
