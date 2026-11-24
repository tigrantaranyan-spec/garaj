<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$ADMIN_EMAIL = 'tigotaranyan333@gmail.com';

$host = 'localhost';
$dbname = 'garaj_db';
$username = 'root';
$password = '';

try {
    $pdo = new PDO(
        "mysql:host=$host;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$dbname`");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            google_email VARCHAR(150) NOT NULL UNIQUE,
            name VARCHAR(100) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            whatsapp VARCHAR(30) DEFAULT NULL,
            seller_type VARCHAR(50) DEFAULT 'Անհատ',
            is_admin TINYINT(1) DEFAULT 0,
            is_banned TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    if (!$pdo->query("SHOW COLUMNS FROM users LIKE 'is_admin'")->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0");
    }
    if (!$pdo->query("SHOW COLUMNS FROM users LIKE 'is_banned'")->fetch()) {
        $pdo->exec("ALTER TABLE users ADD COLUMN is_banned TINYINT(1) DEFAULT 0");
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS cars (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            vehicle_type VARCHAR(50) NOT NULL,
            category VARCHAR(100) NOT NULL,
            mileage_state VARCHAR(50) NOT NULL,
            seller_type VARCHAR(50) NOT NULL,
            region VARCHAR(50) NOT NULL,
            city VARCHAR(80) DEFAULT NULL,
            village VARCHAR(80) DEFAULT NULL,
            vin_status ENUM('provided', 'hidden', 'none') NOT NULL DEFAULT 'hidden',
            vin_code VARCHAR(17) DEFAULT NULL,
            brand VARCHAR(60) NOT NULL,
            model VARCHAR(80) NOT NULL,
            year SMALLINT NOT NULL,
            mileage INT NOT NULL,
            damage VARCHAR(30) NOT NULL,
            gas VARCHAR(60) NOT NULL,
            steering VARCHAR(20) NOT NULL,
            customs VARCHAR(10) NOT NULL,
            color VARCHAR(50) DEFAULT NULL,
            tire_size VARCHAR(50) DEFAULT NULL,
            headlights VARCHAR(80) DEFAULT NULL,
            interior_color VARCHAR(50) DEFAULT NULL,
            interior_type VARCHAR(80) DEFAULT NULL,
            sunroof VARCHAR(80) DEFAULT NULL,
            comfort TEXT DEFAULT NULL,
            price DECIMAL(14,2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'USD',
            description TEXT DEFAULT NULL,
            contact_phone VARCHAR(30) NOT NULL,
            contact_whatsapp VARCHAR(30) DEFAULT NULL,
            is_vip TINYINT(1) DEFAULT 0,
            views_count INT DEFAULT 0,
            status ENUM('pending', 'active', 'rejected', 'sold') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    if (!$pdo->query("SHOW COLUMNS FROM cars LIKE 'is_vip'")->fetch()) {
        $pdo->exec("ALTER TABLE cars ADD COLUMN is_vip TINYINT(1) DEFAULT 0");
    }
    if (!$pdo->query("SHOW COLUMNS FROM cars LIKE 'views_count'")->fetch()) {
        $pdo->exec("ALTER TABLE cars ADD COLUMN views_count INT DEFAULT 0");
    }

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS car_images (
            id INT AUTO_INCREMENT PRIMARY KEY,
            car_id INT NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            is_main BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            car_id INT NULL,
            sender_email VARCHAR(150) NOT NULL,
            sender_name VARCHAR(100) NOT NULL,
            receiver_phone VARCHAR(30) DEFAULT NULL,
            car_title VARCHAR(150) DEFAULT NULL,
            message_text TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS price_offers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            car_id INT NOT NULL,
            buyer_name VARCHAR(100) NOT NULL,
            buyer_phone VARCHAR(30) NOT NULL,
            offered_price DECIMAL(14,2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'USD',
            status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            car_id INT NULL,
            reporter_email VARCHAR(150) DEFAULT NULL,
            reason VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            admin_email VARCHAR(150) NOT NULL,
            action_text VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
} catch (PDOException $e) {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Տվյալների բազայի սխալ: ' . $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function isUserAdmin(array $userRow, string $adminEmail): bool {
    $email = trim($userRow['google_email'] ?? $userRow['email'] ?? '');
    if ($email === '' || trim($adminEmail) === '') {
        return false;
    }
    return strcasecmp($email, trim($adminEmail)) === 0;
}

function containsProfanityServer(string $text): bool {
    if ($text === '') {
        return false;
    }
    $clean = preg_replace('/[*@#$!+\-_]/u', '', $text);
    $patterns = [
        '/\b(բոզ|ախպերոջդ|քունեմ|ծոծ|գանդոն|պոռնիկ|հիմար|ապուշ|անասուն|քաք)\b/iu',
        '/\b(boz|bozi|qunem|gandon|pornik|qak)\b/iu',
        '/\b(ху[йяеёию]|п[ие]зд[аоуыеё]|еб[аоуиыеё]|бл[яеё]|сук[аиу]|мраз[ьи]|шлюх[аи]|урод[ыа]?|дебил[ыа]?|муд[ао]к)\b/iu',
        '/\b(f+u+c+k+|s+h+i+t+|b+i+t+c+h+|a+s+s+h+o+l+e+|c+u+n+t+|d+i+c+k+|w+h+o+r+e+|b+a+s+t+a+r+d+)\b/i'
    ];
    foreach ($patterns as $rx) {
        if (preg_match($rx, $clean)) {
            return true;
        }
    }
    return false;
}