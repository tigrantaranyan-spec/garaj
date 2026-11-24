CREATE DATABASE IF NOT EXISTS garaj_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE garaj_db;

DROP TABLE IF EXISTS car_images;
DROP TABLE IF EXISTS cars;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_email VARCHAR(150) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30) DEFAULT NULL,
    seller_type VARCHAR(50) DEFAULT 'Անհատ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cars (
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
    status ENUM('active', 'sold') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE car_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    car_id INT NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);