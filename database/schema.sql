-- =====================================================================
-- TravelSphere Database Schema DDL (v2.0.0)
-- Target: MySQL 8.x Engine
-- Character Set: utf8mb4 / Collation: utf8mb4_unicode_ci
-- =====================================================================

CREATE DATABASE IF NOT EXISTS travelsphere_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE travelsphere_db;

-- ---------------------------------------------------------------------
-- 1. ROLES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(30) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. USERS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION') DEFAULT 'ACTIVE',
    requires_password_change BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_username (username),
    INDEX idx_users_uuid (uuid)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. USER_ROLES JUNCTION TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT UNSIGNED NOT NULL,
    role_id BIGINT UNSIGNED NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_ur_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ur_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. CUSTOMER_PROFILES TABLE (Data Minimization: No Passport/Aadhar)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_profiles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL UNIQUE,
    phone_country_code VARCHAR(10) DEFAULT '+91',
    phone_number VARCHAR(20),
    address_line VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cp_phone (phone_number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. DESTINATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS destinations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) UNIQUE,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    description TEXT NOT NULL,
    climate VARCHAR(100),
    best_time_to_visit VARCHAR(100),
    hero_image_url VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_featured BOOLEAN DEFAULT FALSE,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dest_name (name),
    INDEX idx_dest_slug (slug),
    INDEX idx_dest_featured (is_featured),
    INDEX idx_dest_published (is_published)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. PLACES TABLE (Points of Interest within Destination)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS places (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    destination_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    category ENUM('HERITAGE', 'NATURE', 'BEACH', 'RELIGIOUS', 'ADVENTURE', 'SHOPPING') DEFAULT 'HERITAGE',
    description TEXT NOT NULL,
    entry_fee DECIMAL(10, 2) DEFAULT 0.00,
    opening_time VARCHAR(20),
    closing_time VARCHAR(20),
    image_url VARCHAR(500),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_places_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    INDEX idx_places_dest (destination_id),
    INDEX idx_places_active (is_active)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. HOTELS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    destination_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(150) NOT NULL,
    star_rating DECIMAL(2, 1) DEFAULT 4.0 CHECK (star_rating >= 1.0 AND star_rating <= 5.0),
    address VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(30),
    contact_email VARCHAR(100),
    hero_image_url VARCHAR(500) NOT NULL,
    description TEXT,
    starting_price_per_night DECIMAL(10, 2) NOT NULL,
    has_swimming_pool BOOLEAN DEFAULT FALSE,
    has_wifi BOOLEAN DEFAULT TRUE,
    has_parking BOOLEAN DEFAULT TRUE,
    has_restaurant BOOLEAN DEFAULT TRUE,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotels_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
    INDEX idx_hotels_dest (destination_id),
    INDEX idx_hotels_rating (star_rating),
    INDEX idx_hotels_active (is_active)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. HOTEL_ROOMS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotel_rooms (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hotel_id BIGINT UNSIGNED NOT NULL,
    room_type ENUM('STANDARD', 'DELUXE', 'EXECUTIVE_SUITE', 'PRESIDENTIAL_SUITE') NOT NULL,
    max_occupancy INT UNSIGNED NOT NULL DEFAULT 2,
    has_ac BOOLEAN DEFAULT TRUE,
    is_breakfast_included BOOLEAN DEFAULT FALSE,
    price_per_night DECIMAL(10, 2) NOT NULL,
    total_inventory INT UNSIGNED NOT NULL DEFAULT 10,
    available_inventory INT UNSIGNED NOT NULL DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hr_hotel (hotel_id),
    INDEX idx_hr_active (is_active)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. PACKAGES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    destination_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    tier ENUM('BRONZE', 'SILVER', 'GOLD') NOT NULL DEFAULT 'SILVER',
    duration_days INT UNSIGNED NOT NULL,
    duration_nights INT UNSIGNED NOT NULL,
    base_price_per_person DECIMAL(10, 2) NOT NULL,
    hero_image_url VARCHAR(500) NOT NULL,
    inclusions TEXT NOT NULL,
    exclusions TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pkg_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
    INDEX idx_pkg_dest (destination_id),
    INDEX idx_pkg_tier (tier)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. PACKAGE_ITEMS TABLE (Itinerary Schedule)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS package_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT UNSIGNED NOT NULL,
    day_number INT UNSIGNED NOT NULL,
    activity_title VARCHAR(150) NOT NULL,
    activity_description TEXT NOT NULL,
    is_meals_included BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pi_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
    INDEX idx_pi_pkg_day (package_id, day_number)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. BOOKINGS TABLE (Master Booking Record)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(15) NOT NULL UNIQUE,  -- E.g. TS-2026-98124
    user_id BIGINT UNSIGNED NOT NULL,
    booking_type ENUM('HOTEL', 'PACKAGE') NOT NULL,
    status ENUM('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED') DEFAULT 'PENDING',
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    customer_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_book_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    INDEX idx_book_user (user_id),
    INDEX idx_book_status (status),
    INDEX idx_book_ref (booking_reference)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. HOTEL_BOOKING_ITEMS TABLE (Strict Referential Integrity)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotel_booking_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    hotel_room_id BIGINT UNSIGNED NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    rooms_count INT UNSIGNED NOT NULL DEFAULT 1,
    guests_count INT UNSIGNED NOT NULL DEFAULT 1,
    price_per_night DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hbi_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_hbi_room FOREIGN KEY (hotel_room_id) REFERENCES hotel_rooms(id) ON DELETE RESTRICT,
    INDEX idx_hbi_booking (booking_id),
    INDEX idx_hbi_dates (check_in_date, check_out_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. PACKAGE_BOOKING_ITEMS TABLE (Strict Referential Integrity)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS package_booking_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT UNSIGNED NOT NULL,
    package_id BIGINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    guests_count INT UNSIGNED NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pbi_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_pbi_pkg FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT,
    INDEX idx_pbi_booking (booking_id),
    INDEX idx_pbi_start (start_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. PAYMENT_ATTEMPTS TABLE (1:N Payments & Single Success Guarantee)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    attempt_reference VARCHAR(36) NOT NULL UNIQUE,
    booking_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY',
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    payment_method VARCHAR(50) NULL,
    status ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'INITIATED',
    failure_reason VARCHAR(255) NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    INDEX idx_pay_order (razorpay_order_id),
    INDEX idx_pay_booking (booking_id),
    INDEX idx_pay_status (status),
    -- Engine-level guarantee: exactly ONE SUCCESS record allowed per booking
    UNIQUE KEY uq_one_success_per_booking (booking_id, (CASE WHEN status = 'SUCCESS' THEN 'SUCCESS' ELSE NULL END))
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. REVIEWS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('DESTINATION', 'HOTEL', 'PACKAGE') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    rating INT UNSIGNED NOT NULL CHECK (rating >= 1 AND rating <= 5),
    headline VARCHAR(150),
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rev_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uq_review_user_target (user_id, target_type, target_id),
    INDEX idx_rev_target (target_type, target_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 16. WISHLISTS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlists (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    target_type ENUM('DESTINATION', 'HOTEL', 'PACKAGE') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist_user_target (user_id, target_type, target_id),
    CONSTRAINT fk_wish_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_wish_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 17. PASSWORD_RESET_TOKENS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_prt_token (token_hash)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 18. CHAT_SESSIONS TABLE (AI Travel Assistant)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_uuid VARCHAR(36) NOT NULL UNIQUE,
    user_id BIGINT UNSIGNED NOT NULL,
    session_title VARCHAR(150) NOT NULL DEFAULT 'Trip Planning Conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_cs_user (user_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 19. CHAT_MESSAGES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    sender_role ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    content TEXT NOT NULL,
    tokens_consumed INT UNSIGNED DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
    INDEX idx_cm_session (session_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 20. NOTIFICATIONS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('BOOKING', 'PAYMENT', 'PROMOTION', 'SYSTEM') DEFAULT 'SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 21. REFRESH_TOKENS TABLE (Secure Hashed Refresh Token Storage)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_rt_token_hash (token_hash),
    INDEX idx_rt_user (user_id)
) ENGINE=InnoDB;


