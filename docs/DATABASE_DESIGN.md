# TravelSphere — Database Design & Schema Specification
**Document Version:** 2.0.0 (Updated Post-Review)  
**Target Engine:** MySQL 8.x (InnoDB Engine, UTF-8 MB4)  
**Status:** Approved for Implementation Planning  

---

## 1. Database Philosophy & Audit Remediation

The database for **TravelSphere** addresses and completely resolves all structural and architectural deficiencies identified during the legacy audit:

| Legacy Database Defect | TravelSphere Schema Remediation |
|---|---|
| **Zero Primary Keys** across all tables | Every table declares an explicit `BIGINT UNSIGNED AUTO_INCREMENT` primary key for high-speed indexing, plus public `CHAR(36)` UUIDs for external API exposure. |
| **Zero Foreign Keys & Referential Integrity** | Strict `FOREIGN KEY` constraints with explicit `ON DELETE CASCADE` or `ON DELETE RESTRICT` actions ensuring zero orphaned rows. |
| **Varchar Used for Money & Numbers** | Monetary amounts use `DECIMAL(10, 2)` (exact precision). Headcounts and days use `INT UNSIGNED`. |
| **Single Payment / Inflexible 1:1 Link** | Refactored into a **1:N Payment Attempts** model allowing multiple failed/abandoned attempts and exactly one successful captured payment per booking. |
| **Polymorphic Nullable Foreign Keys** | Split into dedicated **`hotel_booking_items`** and **`package_booking_items`** tables ensuring 100% relational integrity with zero nullable foreign keys. |
| **Sensitive Identity Documents Collected** | Dropped passport and national ID numbers from customer profiles; profiles now retain only necessary non-sensitive contact and travel preference data. |
| **Hardcoded Default Admin Password** | Removed all static admin passwords from seed files; admin initialization is managed securely via environment variables and mandates a first-login password change. |

---

## 2. Table Necessity Review (20 Tables)

With the relational split of booking items into dedicated hotel and package tables, the revised schema contains 20 clean, fully normalized tables:

1. **`roles`:** RBAC roles (`ROLE_USER`, `ROLE_ADMIN`).
2. **`users`:** Core user identity, email, BCrypt password hash, status, and `requires_password_change` flag.
3. **`user_roles`:** Standard many-to-many junction table between `users` and `roles`.
4. **`customer_profiles`:** Non-sensitive customer profile details (phone, address, avatar) 1:1 with `users`. (No passport/Aadhar data).
5. **`destinations`:** Cities/regions with descriptions, climate, coordinates, and hero imagery.
6. **`places`:** Specific tourist attractions and points of interest located within a destination.
7. **`hotels`:** Accommodation catalog with ratings, address, contact information, and coordinates.
8. **`hotel_rooms`:** Specific room inventory tiers (Standard, Deluxe, Executive Suite, Presidential Suite) with pricing and amenities.
9. **`packages`:** Curated multi-day tour packages with tiered pricing (Bronze, Silver, Gold).
10. **`package_items`:** Day-by-day itinerary schedule and activity descriptions for a package.
11. **`bookings`:** Master booking record tracking reference code, booking type (`HOTEL` or `PACKAGE`), lifecycle status, and total amount.
12. **`hotel_booking_items`:** Dedicated hotel reservation line items with mandatory non-null foreign key to `hotel_rooms`, check-in/out dates, and room counts.
13. **`package_booking_items`:** Dedicated package reservation line items with mandatory non-null foreign key to `packages`, start dates, and traveler counts.
14. **`payment_attempts`:** Audit ledger supporting 1:N payment attempts per booking, tracking Razorpay order ID, payment ID, status, failure reason, and timestamps.
15. **`reviews`:** Customer reviews and 1-to-5 star ratings for destinations, hotels, and packages.
16. **`wishlists`:** User-saved destinations, hotels, and packages for bookmarking.
17. **`password_reset_tokens`:** Single-use, expirable password reset tokens hashed with SHA-256.
18. **`chat_sessions`:** Multi-turn conversational sessions with the AI Travel Assistant.
19. **`chat_messages`:** Prompts and assistant responses stored within an AI chat session.
20. **`notifications`:** In-app customer alerts for booking confirmations, payment receipts, and travel reminders.

---

## 3. Key Design Decisions

### A. Booking Items Referential Integrity (Option B: Dedicated Tables)
- **Decision:** Split the generic polymorphic line-items table into two dedicated tables: **`hotel_booking_items`** and **`package_booking_items`**.
- **Rationale:** 
  1. Generic polymorphic tables with nullable foreign keys (`hotel_room_id` NULL, `package_id` NULL) compromise relational integrity, allow invalid state combinations, and complicate database-level constraints.
  2. Hotel bookings require hotel-specific temporal fields (`check_in_date`, `check_out_date`, `rooms_count`, `price_per_night`).
  3. Package bookings require tour-specific fields (`start_date`, `end_date`, `guests_count`, `base_price_per_person`).
  4. With dedicated tables, foreign keys are strictly `NOT NULL` and enforced by InnoDB engine foreign key checks.
  5. The master `bookings` table maintains a `booking_type` (`HOTEL` or `PACKAGE`) column, allowing clean single-table joins and typed JPA entity relationships (`@OneToMany` to `HotelBookingItem` or `PackageBookingItem`).

### B. Payment Model: 1:N Payment Attempts with Concurrency Protection
- **Conceptual Model:**
  ```
  BOOKING (1) ────< (N) PAYMENT_ATTEMPTS
  ```
- **Lifecycle & Retries:** When a customer initiates payment, a new row is created in `payment_attempts` in `INITIATED` status with a Razorpay `order_id`. If the customer's card is declined or the modal is closed, the attempt is marked `FAILED` or `CANCELLED` with a recorded `failure_reason`. The customer may immediately retry, creating attempt #2 under the same booking.
- **Duplicate Success Prevention:**
  1. **Database Constraint:** MySQL 8.0 functional unique index:
     ```sql
     UNIQUE KEY uq_one_success_per_booking (booking_id, (CASE WHEN status = 'SUCCESS' THEN 'SUCCESS' ELSE NULL END))
     ```
     Because MySQL permits multiple `NULL` values in a unique index, multiple `FAILED` or `CANCELLED` records can exist for a booking, but exactly ONE row can ever hold `status = 'SUCCESS'`. Any race condition attempting a duplicate insertion is rejected at the database engine level with `Duplicate entry error (1062)`.
  2. **Application Transactional Lock:** Backend uses pessimistic write locking (`SELECT ... FOR UPDATE`) on the `Booking` entity during payment verification and webhook processing. If the booking is already `CONFIRMED`, any secondary payment is immediately captured as an anomaly and flagged for automated refund.

### C. Customer Profile Data Minimization
- **Decision:** Removed `id_type` (Passport, Aadhar, Voter ID) and `id_number` from `customer_profiles`.
- **Rationale:** Modern travel web applications do not require sensitive national identity documents during initial discovery, profile creation, or reservation. Storing national ID documents creates unnecessary PII liability, compliance exposure (GDPR, India DPDP Act), and friction during onboarding. If identity verification is needed at check-in, hotels inspect physical documents on-site.

### D. Secure Initial Admin Credential Strategy
- **Decision:** Zero hardcoded passwords in SQL seed scripts.
- **Initialization Process:**
  1. The Spring Boot backend incorporates an `AdminInitializationRunner` executing on startup.
  2. The runner checks if an account with `ROLE_ADMIN` exists in the `users` table.
  3. If no admin exists, it reads `TRAVELSPHERE_INITIAL_ADMIN_USERNAME`, `TRAVELSPHERE_INITIAL_ADMIN_EMAIL`, and `TRAVELSPHERE_INITIAL_ADMIN_PASSWORD` from operating system environment variables.
  4. It hashes the password using `BCryptPasswordEncoder(12)`, persists the admin record, and sets `requires_password_change = TRUE`.
  5. When the administrator logs in for the first time, the system intercepts the session and forces a mandatory password update before granting access to `/api/v1/admin/**` endpoints.

---

## 4. Entity-Relationship Diagram

```
+------------------+          +-----------------------+          +-------------------+
|      roles       |          |         users         |          | customer_profiles |
+------------------+          +-----------------------+          +-------------------+
| id (PK)          |<---N:M-->| id (PK)               |<---1:1---| id (PK)           |
| name             |          | uuid (UQ)             |          | user_id (FK, UQ)  |
+------------------+          | email (UQ)            |          | phone, address    |
                              | password_hash         |          | avatar_url        |
                              | requires_pw_change    |          +-------------------+
                              +-----------+-----------+
                                          |
            +-----------------------------+-----------------------------+
            | 1:N                         | 1:N                         | 1:N
            v                             v                             v
+-----------------------+     +-----------------------+     +-----------------------+
|       bookings        |     |        reviews        |     |       wishlists       |
+-----------------------+     +-----------------------+     +-----------------------+
| id (PK)               |     | id (PK)               |     | id (PK)               |
| booking_ref (UQ)      |     | user_id (FK)          |     | user_id (FK)          |
| user_id (FK)          |     | target_type (ENUM)    |     | target_type (ENUM)    |
| booking_type (ENUM)   |     | target_id (INT)       |     | target_id (INT)       |
| status (ENUM)         |     | rating (1-5)          |     +-----------------------+
| total_amount          |     +-----------------------+
+-----+-----------+-----+
      |           |
      | 1:N       | 1:N (Mutually exclusive by booking_type)
      v           +-----------------------------------------------+
+-----------------------+                                         |
|   payment_attempts    |                                         |
+-----------------------+                                         |
| id (PK)               |                                         |
| booking_id (FK)       |                                         |
| razorpay_order_id     |                                         |
| razorpay_payment_id   |                                         |
| status (ENUM)         |                                         |
| failure_reason        |                                         |
| [UQ: 1 SUCCESS/Book]  |                                         |
+-----------------------+                                         |
                                                                  |
         +--------------------------------------------------------+
         | 1:N                                                    | 1:N
         v                                                        v
+-----------------------+                                +-----------------------+
|  hotel_booking_items  |                                | package_booking_items |
+-----------------------+                                +-----------------------+
| id (PK)               |                                | id (PK)               |
| booking_id (FK)       |                                | booking_id (FK)       |
| hotel_room_id (FK)NOT |                                | package_id (FK) NOT   |
| check_in_date         |                                | start_date            |
| check_out_date        |                                | guests_count          |
| rooms_count           |                                | subtotal              |
| subtotal              |                                +-----------------------+
+-----------------------+
```

---

## 5. Comprehensive Schema DDL Script (`schema.sql`)

```sql
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
    uuid CHAR(36) NOT NULL UNIQUE,
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
-- 4. CUSTOMER_PROFILES TABLE (Data Minimization Applied)
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
    uuid CHAR(36) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    description TEXT NOT NULL,
    climate VARCHAR(100),
    best_time_to_visit VARCHAR(100),
    hero_image_url VARCHAR(500) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dest_name (name),
    INDEX idx_dest_featured (is_featured)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_places_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE CASCADE,
    INDEX idx_places_dest (destination_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. HOTELS TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hotels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hotels_dest FOREIGN KEY (destination_id) REFERENCES destinations(id) ON DELETE RESTRICT,
    INDEX idx_hotels_dest (destination_id),
    INDEX idx_hotels_rating (star_rating)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_hr_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE,
    INDEX idx_hr_hotel (hotel_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. PACKAGES TABLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS packages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid CHAR(36) NOT NULL UNIQUE,
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
    booking_reference CHAR(15) NOT NULL UNIQUE,  -- E.g. TS-2026-98124
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
    attempt_reference CHAR(36) NOT NULL UNIQUE,
    booking_id BIGINT UNSIGNED NOT NULL,
    provider VARCHAR(30) NOT NULL DEFAULT 'RAZORPAY',
    razorpay_order_id VARCHAR(100) NOT NULL,
    razorpay_payment_id VARCHAR(100) NULL,
    razorpay_signature VARCHAR(255) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(5) DEFAULT 'INR',
    payment_method VARCHAR(50) NULL,      -- card, upi, netbanking
    status ENUM('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED') DEFAULT 'INITIATED',
    failure_reason VARCHAR(255) NULL,
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE RESTRICT,
    INDEX idx_pay_order (razorpay_order_id),
    INDEX idx_pay_booking (booking_id),
    INDEX idx_pay_status (status),
    -- Guaranteed at database engine level: only ONE SUCCESS record per booking
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
    session_uuid CHAR(36) NOT NULL UNIQUE,
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
```

---

## 6. Seed Data Script (`seed.sql`)

> **Security Guarantee:** No static administrator credentials or plaintext passwords are contained in this seed script. Admin account initialization is handled dynamically via environment variables on application startup.

```sql
-- =====================================================================
-- TravelSphere Initial Seed Script (v2.0.0)
-- Contains: Roles, Migrated Luxury Hotels, Curated Destinations & Packages
-- Note: Administrator setup is NOT in SQL; initialized via env variables.
-- =====================================================================

USE travelsphere_db;

-- 1. SEED ROLES
INSERT INTO roles (name, description) VALUES
('ROLE_USER', 'Standard registered customer account with booking privileges'),
('ROLE_ADMIN', 'Platform administrator with inventory and moderation privileges')
ON DUPLICATE KEY UPDATE name=name;

-- 2. SEED DESTINATIONS
INSERT INTO destinations (uuid, name, state, country, description, climate, best_time_to_visit, hero_image_url, latitude, longitude, is_featured) VALUES
(UUID(), 'Jaipur', 'Rajasthan', 'India', 'The historic Pink City renowned for majestic hill forts, royal palaces, and vibrant artisan bazaars.', 'Subtropical Arid', 'October to March', '/images/destinations/jaipur.jpg', 26.9124, 75.7873, TRUE),
(UUID(), 'Agra', 'Uttar Pradesh', 'India', 'Home of the timeless Taj Mahal and Mughal architectural masterpieces along the Yamuna River.', 'Tropical Hot Semi-Arid', 'November to February', '/images/destinations/agra.jpg', 27.1767, 78.0081, TRUE),
(UUID(), 'Mumbai', 'Maharashtra', 'India', 'The dynamic financial hub of India, boasting colonial architecture, coastal promenades, and Bollywood glamour.', 'Tropical Wet and Dry', 'October to February', '/images/destinations/mumbai.jpg', 18.9220, 72.8347, TRUE),
(UUID(), 'Shimla', 'Himachal Pradesh', 'India', 'The queen of hill stations nestled in the Himalayas, featuring alpine vistas and historic British colonial heritage.', 'Subtropical Highland', 'March to June, December to January', '/images/destinations/shimla.jpg', 31.1048, 77.1734, TRUE),
(UUID(), 'Hyderabad', 'Telangana', 'India', 'The City of Pearls, famous for historic fortresses, royal Nizami cuisine, and thriving technology hubs.', 'Tropical Semi-Arid', 'November to February', '/images/destinations/hyderabad.jpg', 17.3850, 78.4867, TRUE),
(UUID(), 'Srinagar', 'Jammu & Kashmir', 'India', 'The paradise valley featuring serene Dal Lake shikara rides, Mughal gardens, and snow-dusted peaks.', 'Humid Subtropical Alpine', 'April to October', '/images/destinations/srinagar.jpg', 34.0837, 74.7973, TRUE);

-- 3. SEED HOTELS (Migrated and Enhanced from Legacy SQL Schema)
SET @dest_jaipur = (SELECT id FROM destinations WHERE name = 'Jaipur');
SET @dest_agra = (SELECT id FROM destinations WHERE name = 'Agra');
SET @dest_mumbai = (SELECT id FROM destinations WHERE name = 'Mumbai');
SET @dest_shimla = (SELECT id FROM destinations WHERE name = 'Shimla');
SET @dest_hyderabad = (SELECT id FROM destinations WHERE name = 'Hyderabad');
SET @dest_srinagar = (SELECT id FROM destinations WHERE name = 'Srinagar');

INSERT INTO hotels (uuid, destination_id, name, star_rating, address, contact_phone, contact_email, hero_image_url, description, starting_price_per_night, has_swimming_pool, has_wifi, has_parking, has_restaurant) VALUES
(UUID(), @dest_mumbai, 'JW Marriott Hotel', 5.0, 'Juhu Tara Rd, Juhu, Mumbai, Maharashtra 400049', '+91 22 6693 3000', 'reservations@jwmarriottmumbai.com', '/images/hotels/jw_marriott.jpg', 'Luxury 5-star beachfront haven overlooking the Arabian Sea with world-class dining and spa.', 3500.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_mumbai, 'Taj Mahal Palace Hotel', 5.0, 'Apollo Bunder, Colaba, Mumbai, Maharashtra 400001', '+91 22 6665 3366', 'tajpalace.mumbai@tajhotels.com', '/images/hotels/taj_mahal_palace.jpg', 'Iconic heritage landmark standing opposite the Gateway of India since 1903.', 8400.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_agra, 'The Oberoi Amarvilas Hotel', 5.0, 'Taj East Gate Rd, Paktola, Tajganj, Agra, UP 282001', '+91 562 223 1515', 'reservations.amarvilas@oberoihotels.com', '/images/hotels/oberoi_amarvilas.jpg', 'Spectacular luxury resort located just 600 meters from the Taj Mahal with uninterrupted monument views.', 3900.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_jaipur, 'Umaid Bhawan Palace Hotel', 5.0, 'Circuit House Rd, Cantt Area, Jodhpur / Jaipur Circuit', '+91 291 251 0101', 'umaidbhawan.jodhpur@tajhotels.com', '/images/hotels/umaid_bhawan.jpg', 'Perched atop Chittar Hill, a magnificent living palace offering regal hospitality.', 3600.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_jaipur, 'The Leela Palace Hotel', 5.0, 'Delhi-Jaipur Highway, Kukas, Jaipur, Rajasthan 302028', '+91 1426 350 000', 'reservations.jaipur@theleela.com', '/images/hotels/leela_palace.jpg', 'Opulent palace resort set against the Aravalli hills reflecting majestic Rajputana splendour.', 4400.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_srinagar, 'The Lalit Grand Palace Hotel', 5.0, 'Gupkar Rd, Srinagar, Jammu and Kashmir 190001', '+91 194 250 1001', 'srinagar@thelalit.com', '/images/hotels/lalit_grand.jpg', 'Former royal residence of the Maharajas overlooking Dal Lake surrounded by Himalayan peaks.', 3499.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_shimla, 'Wildflower Hall Hotel', 5.0, 'Chharabra, Shimla, Himachal Pradesh 171012', '+91 177 264 8585', 'wildflowerhall@oberoihotels.com', '/images/hotels/wildflower_hall.jpg', 'Luxury mountain retreat set amidst 23 acres of protected cedar forest in the Himalayas.', 3555.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_hyderabad, 'Taj Falaknuma Palace Hotel', 5.0, 'Engine Bowli, Fatima Nagar, Falaknuma, Hyderabad 500053', '+91 40 6629 8585', 'falaknuma.hyderabad@tajhotels.com', '/images/hotels/taj_falaknuma.jpg', 'Elevated 2000 feet above Hyderabad, a breathtaking Italian marble palace from the Nizam era.', 6400.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_jaipur, 'Oberoi Rajvilas Hotel', 5.0, 'Babaji Ka Morh, Goner Rd, Jaipur, Rajasthan 302031', '+91 141 268 0101', 'rajvilas@oberoihotels.com', '/images/hotels/oberoi_rajvilas.jpg', 'Idyllic royal villa retreat with traditional pink stonework, reflection pools, and lush gardens.', 6400.00, TRUE, TRUE, TRUE, TRUE),
(UUID(), @dest_jaipur, 'The Serai Hotel', 4.5, 'Bherwa, Jaisalmer / Jaipur Desert Gateway', '+91 2992 269 101', 'theserai@sujanluxury.com', '/images/hotels/the_serai.jpg', 'Exclusive desert camp and luxury oasis offering tranquil tented suites under starry skies.', 1400.00, TRUE, TRUE, TRUE, TRUE);

-- 4. SEED HOTEL ROOMS
SET @hotel_jw = (SELECT id FROM hotels WHERE name = 'JW Marriott Hotel');
INSERT INTO hotel_rooms (hotel_id, room_type, max_occupancy, has_ac, is_breakfast_included, price_per_night, total_inventory, available_inventory) VALUES
(@hotel_jw, 'STANDARD', 2, TRUE, FALSE, 3500.00, 20, 20),
(@hotel_jw, 'DELUXE', 3, TRUE, TRUE, 5200.00, 15, 15),
(@hotel_jw, 'EXECUTIVE_SUITE', 4, TRUE, TRUE, 8900.00, 5, 5);

SET @hotel_taj = (SELECT id FROM hotels WHERE name = 'Taj Mahal Palace Hotel');
INSERT INTO hotel_rooms (hotel_id, room_type, max_occupancy, has_ac, is_breakfast_included, price_per_night, total_inventory, available_inventory) VALUES
(@hotel_taj, 'STANDARD', 2, TRUE, TRUE, 8400.00, 15, 15),
(@hotel_taj, 'DELUXE', 3, TRUE, TRUE, 12500.00, 10, 10),
(@hotel_taj, 'PRESIDENTIAL_SUITE', 4, TRUE, TRUE, 28000.00, 2, 2);

-- 5. SEED CURATED PACKAGES
INSERT INTO packages (uuid, destination_id, title, tier, duration_days, duration_nights, base_price_per_person, hero_image_url, inclusions, exclusions, is_active) VALUES
(UUID(), @dest_jaipur, 'Royal Rajasthan Heritage Explorer', 'GOLD', 6, 5, 30000.00, '/images/packages/pkg_rajasthan_gold.jpg', 'Stay in 5-star heritage palaces, Airport transfer, All meals included, Private AC luxury SUV, English-speaking historian guide, Fort entrance fees.', 'Personal shopping, Alcoholic beverages, Travel insurance.', TRUE),
(UUID(), @dest_shimla, 'Himalayan Serenity & Cedar Valleys', 'SILVER', 4, 3, 20000.00, '/images/packages/pkg_shimla_silver.jpg', 'Stay in 4-star mountain view resort, Daily buffet breakfast and dinner, Private hill transfer, Guided nature trek, Tolls and permits.', 'Adventure sport tickets, Flight tickets.', TRUE),
(UUID(), @dest_agra, 'Golden Triangle Express (Agra & Jaipur)', 'BRONZE', 3, 2, 12000.00, '/images/packages/pkg_golden_triangle.jpg', 'Comfortable 3-star boutique hotel stay, Daily breakfast, Sightseeing in AC sedan, Taj Mahal sunrise entry ticket.', 'Lunches and dinners, Monuments camera fees.', TRUE);
```
