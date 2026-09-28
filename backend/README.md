# TravelSphere Backend Foundation

Spring Boot 3.x backend foundation and Core Security Services for **TravelSphere** — an AI-powered next-generation Travel & Tourism Management Platform.

---

## 1. Technology Specifications

- **Language:** Java 21 (LTS)
- **Framework:** Spring Boot 3.3.5
- **Build Tool:** Apache Maven 3.9.6
- **Database:** MySQL 8.x
- **ORM / Persistence:** Spring Data JPA / Hibernate 6.x
- **Security:** Spring Security 6.x, BCrypt (cost factor 12), JJWT 0.12.6
- **Validation:** Jakarta Bean Validation (Hibernate Validator)

---

## 2. Directory Structure

```
backend/
├── pom.xml
├── README.md
└── src/
    ├── main/
    │   ├── java/com/travelsphere/
    │   │   ├── TravelSphereApplication.java
    │   │   ├── config/              # SecurityConfig
    │   │   ├── controller/          # AuthController, UserController, AdminProbeController, HealthController
    │   │   ├── dto/                 # Request/Response payloads
    │   │   │   ├── request/         # RegisterRequest, LoginRequest, etc.
    │   │   │   └── response/        # ApiResponse, ApiErrorResponse, AuthResponse, UserResponse
    │   │   ├── entity/              # JPA Entities (User, RefreshToken, PasswordResetToken, etc.)
    │   │   │   └── enums/           # RoleType, UserStatus, etc.
    │   │   ├── exception/           # GlobalExceptionHandler, BadRequestException, etc.
    │   │   ├── repository/          # UserRepository, RefreshTokenRepository, etc.
    │   │   ├── security/            # UserPrincipal, JwtTokenProvider, JwtAuthenticationFilter, PasswordChangeEnforcementFilter
    │   │   └── service/             # AuthService, UserService
    │   └── resources/
    │       └── application.yml
    └── test/
        └── java/com/travelsphere/
            └── AuthenticationAndSecurityTests.java  # 24 Automated Security Tests
```

---

## 3. Environment Variables Setup

TravelSphere enforces **zero hard-coded secrets**. All sensitive credentials and configurations are injected via environment variables or `.env`.

Copy `.env.example` in the project root to `.env`:

```bash
# Server Configuration
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=travelsphere_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password

# JWT Security
# 15-minute access token TTL (900,000 ms), 7-day refresh token TTL (604,800,000 ms)
JWT_SECRET=your_at_least_32_character_cryptographically_secure_hex_key_here
JWT_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=604800000

# CORS Allowed Origins
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Bootstrap Initial Administrator
TRAVELSPHERE_INITIAL_ADMIN_USERNAME=admin
TRAVELSPHERE_INITIAL_ADMIN_EMAIL=admin@travelsphere.internal
TRAVELSPHERE_INITIAL_ADMIN_PASSWORD=YourSecureTemporaryPassword123!
```

---

## 4. Role System & Authorization

| Role | Description | Permissions |
|---|---|---|
| `ROLE_USER` | Standard registered customer | Access discovery catalog, manage own profile, create/view own bookings & reviews, multi-turn AI assistant |
| `ROLE_ADMIN` | Platform administrator | Full management across catalog, bookings, customer profiles, and dashboard KPIs |

### Initial Admin Mandatory Password Change
- The initial administrator is seeded on startup with `requires_password_change = true`.
- Upon initial login, `PasswordChangeEnforcementFilter` restricts the administrator from accessing any `/api/v1/admin/**` endpoints, returning `403 Forbidden` with errorCode `PASSWORD_CHANGE_REQUIRED`.
- The administrator must execute `POST /api/v1/auth/change-password`. Once changed, `requires_password_change` is reset to `false`, granting full admin access.

---

## 5. Authentication & User Management APIs

### 1. User Registration
`POST /api/v1/auth/register` (Public)

**Request:**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "fullName": "John Doe"
}
```

**Password Policy:** Minimum 8 characters, at least one uppercase letter, one lowercase letter, one digit, and one special character.

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "uuid": "7b8d4e92-3c1a-4d7e-9f8a-5b6c7d8e9f0a",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "requiresPasswordChange": false,
    "roles": ["ROLE_USER"],
    "profile": null
  },
  "timestamp": "2026-09-21T18:00:00.000Z"
}
```

---

### 2. User Login
`POST /api/v1/auth/login` (Public)

Supports login with username or email via `identifier` or `usernameOrEmail`.

**Request:**
```json
{
  "identifier": "johndoe",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "64_char_secure_hex_token...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "requiresPasswordChange": false,
    "user": {
      "uuid": "7b8d4e92-3c1a-4d7e-9f8a-5b6c7d8e9f0a",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "status": "ACTIVE",
      "roles": ["ROLE_USER"]
    }
  },
  "timestamp": "2026-09-21T18:00:00.000Z"
}
```

---

### 3. Refresh Token Flow & Rotation
`POST /api/v1/auth/refresh` (Public)

Rotates the refresh token securely: marks the used refresh token as revoked, generates a new 15-minute access token, and issues a new 7-day refresh token.

**Request:**
```json
{
  "refreshToken": "64_char_secure_hex_token..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "new_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "new_64_char_secure_hex_token...",
    "tokenType": "Bearer",
    "expiresInSeconds": 900,
    "requiresPasswordChange": false,
    "user": { ... }
  }
}
```

---

### 4. Logout & Token Revocation
`POST /api/v1/auth/logout` (Authenticated: `Authorization: Bearer <JWT>`)

Revokes the refresh token. After logout, the refresh token can no longer be used.

**Request (Optional body):**
```json
{
  "refreshToken": "64_char_secure_hex_token..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful. Refresh tokens invalidated.",
  "data": null
}
```

---

### 5. Current User Profile (IDOR Protected)
`GET /api/v1/users/me` (Authenticated)

Extracts user identity strictly from the authenticated JWT `UserPrincipal`.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully.",
  "data": {
    "uuid": "7b8d4e92-3c1a-4d7e-9f8a-5b6c7d8e9f0a",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "fullName": "John Doe",
    "status": "ACTIVE",
    "requiresPasswordChange": false,
    "roles": ["ROLE_USER"],
    "profile": {
      "phoneCountryCode": "+91",
      "phoneNumber": "9876543210",
      "addressLine": "123 Palm Avenue",
      "city": "Bengaluru",
      "state": "Karnataka",
      "country": "India",
      "postalCode": "560001",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }
}
```

---

### 6. Update Profile
`PUT /api/v1/users/me` (Authenticated)

Allows users to update their personal contact details. Disallows modifying roles, account status, password hash, or internal IDs.

**Request:**
```json
{
  "fullName": "Johnathon Doe",
  "phoneCountryCode": "+91",
  "phoneNumber": "9876543210",
  "addressLine": "456 Royal Palms",
  "city": "Bengaluru",
  "state": "Karnataka",
  "country": "India",
  "postalCode": "560001",
  "avatarUrl": "https://example.com/new_avatar.jpg"
}
```

---

### 7. Change Password
`POST /api/v1/auth/change-password` (Authenticated)

Verifies current password, checks password policy, hashes new password with BCrypt (12 rounds), clears `requires_password_change`, and invalidates all existing refresh tokens.

**Request:**
```json
{
  "currentPassword": "SecurePassword123!",
  "newPassword": "NewStrongPassword456@",
  "confirmPassword": "NewStrongPassword456@"
}
```

---

### 8. Forgot Password
`POST /api/v1/auth/forgot-password` (Public)

Returns a constant generic response for both existing and non-existing accounts to prevent user enumeration attacks.

**Request:**
```json
{
  "email": "john.doe@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If the account exists, password reset instructions have been sent.",
  "data": null
}
```

---

### 9. Reset Password
`POST /api/v1/auth/reset-password` (Public)

Validates single-use, 15-minute expiration SHA-256 hashed token, updates password with BCrypt, marks token used, and revokes refresh tokens.

**Request:**
```json
{
  "token": "32_byte_cprng_hex_token...",
  "newPassword": "BrandNewPassword789#",
  "confirmPassword": "BrandNewPassword789#"
}
```

---

## 6. Core Travel Catalogue & Discovery APIs

All catalogue and discovery endpoints are publicly accessible (read-only) without requiring authentication tokens. All endpoints support standard pagination, safe sorting, and structured `ApiResponse<T>` wrappers.

### 1. Destinations

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/destinations` | Paginated list of published destinations | `query`, `country`, `state`, `featured`, `page` (def: 0), `size` (def: 12), `sort` (`name_asc`, `name_desc`) |
| `GET` | `/api/v1/destinations/{id}` | Single destination by numeric ID or UUID | None |
| `GET` | `/api/v1/destinations/slug/{slug}` | Single destination by SEO slug (e.g. `jaipur`) | None |
| `GET` | `/api/v1/destinations/{destinationId}/places` | All active places/attractions within a destination | None |
| `GET` | `/api/v1/destinations/{destinationId}/hotels` | All active hotels within a destination | None |
| `GET` | `/api/v1/destinations/{destinationId}/packages` | All active travel packages within a destination | None |

### 2. Places / Attractions

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/places` | Paginated list of active places | `destinationId`, `category` (`HERITAGE`, `BEACH`, `NATURE`, `ADVENTURE`, `RELIGIOUS`), `query`, `page`, `size`, `sort` (`name_asc`, `name_desc`, `fee_asc`, `fee_desc`) |
| `GET` | `/api/v1/places/{id}` | Single place by numeric ID | None |

### 3. Hotels & Hotel Rooms

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/hotels` | Paginated list of active hotels | `destinationId`, `minPrice`, `maxPrice`, `minRating`, `query`, `page`, `size`, `sort` (`price_asc`, `price_desc`, `rating_desc`, `name_asc`) |
| `GET` | `/api/v1/hotels/{id}` | Single hotel by numeric ID or UUID, including its active rooms | None |
| `GET` | `/api/v1/hotels/{hotelId}/rooms` | Active room inventory list for a specific hotel | None |
| `GET` | `/api/v1/hotel-rooms/{id}` | Single room type details and availability | None |

### 4. Travel Packages & Itineraries

| Method | Endpoint | Description | Query Parameters |
|---|---|---|---|
| `GET` | `/api/v1/packages` | Paginated list of active packages | `destinationId`, `tier` (`BRONZE`, `SILVER`, `GOLD`), `durationDays`, `minPrice`, `maxPrice`, `query`, `page`, `size`, `sort` (`price_asc`, `price_desc`, `duration_asc`, `duration_desc`, `title_asc`) |
| `GET` | `/api/v1/packages/{id}` | Single package by numeric ID or UUID, including day-by-day itinerary items | None |
| `GET` | `/api/v1/packages/{packageId}/items` | Day-by-day activity itinerary items for a package | None |

---

## 7. Core Security Mechanisms

1. **Password Hashing:** `BCryptPasswordEncoder(12)` with unique per-password cryptographic salt.
2. **Access Tokens:** Signed with HMAC-SHA256 (minimum 256-bit key). TTL strictly limited to 15 minutes.
3. **Refresh Tokens:** Opaque 64-character CSPRNG hex strings stored as SHA-256 hashes in MySQL. Refresh tokens cannot be passed as JWT access tokens.
4. **Token Invalidation:** Logout and password change operations revoke refresh tokens in the database.
5. **IDOR Defense:** User identification is resolved strictly from `SecurityContextHolder.getContext().getAuthentication().getPrincipal()`. Client-supplied user IDs in headers, parameters, or payloads are ignored.
6. **HTTP Security Headers:**
   - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`
   - `X-Frame-Options`: `DENY`
   - `X-Content-Type-Options`: `nosniff`
   - `Content-Security-Policy`: `default-src 'self'; script-src 'self' https://checkout.razorpay.com; img-src 'self' data: https:; frame-ancestors 'none';`
   - `Referrer-Policy`: `strict-origin-when-cross-origin`
7. **CSRF Architecture:** CSRF protection is disabled because the application is a stateless REST API with Bearer token authentication in HTTP headers. Browsers do not automatically attach `Authorization: Bearer` headers during cross-site requests.
8. **CORS:** Configurable via `FRONTEND_URL` / `CORS_ALLOWED_ORIGINS` (defaulting to `http://localhost:5173,http://localhost:3000`). Wildcard `*` origins are strictly forbidden for authenticated operations.

---

## 8. Running Tests & Verification

Run the full automated test suite (46 tests covering authentication, security, IDOR, token rotation, catalogue discovery, search, filters, pagination, and sorting):

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-23"
& "C:\Users\khushi\.m2\apache-maven-3.9.6\bin\mvn.cmd" test
```

### Verified Test Matrix (46 Tests across 2 Suites):

#### Suite 1: Authentication & Security (24 Tests)
1. `test01_successfulRegistration` — Valid registration, BCrypt hash verification, safe response.
2. `test02_duplicateUsername` — 409 Conflict rejection.
3. `test03_duplicateEmail` — 409 Conflict rejection.
4. `test04_weakPassword` — 400 Bad Request Bean validation error.
5. `test05_passwordMismatch` — 400 Bad Request error.
6. `test06_successfulLogin` — JWT access token + refresh token generation.
7. `test07_invalidPassword` — 401 Unauthorized rejection.
8. `test08_unknownUser` — 401 Unauthorized rejection.
9. `test09_accessProtectedEndpointWithoutJwt` — 401 Unauthorized rejection.
10. `test10_accessProtectedEndpointWithValidJwt` — 200 OK authenticated response.
11. `test11_accessAdminEndpointAsUser` — 403 Forbidden rejection for `ROLE_USER`.
12. `test12_accessAdminEndpointAsAdmin` — 200 OK for `ROLE_ADMIN`.
13. `test13_getCurrentUser` — Sanitized profile data retrieval without sensitive fields.
14. `test14_updateOwnProfile` — Updating profile contact fields with persistence.
15. `test15_attemptUnauthorizedProfileAccess` — IDOR defense verification.
16. `test16_changePassword` — Password change with old password verification and login invalidation.
17. `test17_forgotPassword` — Safe generic response without user enumeration.
18. `test18_resetPassword` — Password reset with valid single-use token.
19. `test19_expiredResetToken` — 400 Bad Request rejection for expired token.
20. `test20_reusedResetToken` — 400 Bad Request rejection for reused token.
21. `test21_logout` — Refresh token revocation and invalidation.
22. `test22_refreshToken` — Refresh token flow and rotation.
23. `test23_revokedRefreshToken` — Rejection of revoked refresh token.
24. `test24_initialAdminPasswordChangeRequirement` — Admin access blocked until mandatory password change.

#### Suite 2: Travel Catalogue & Discovery (22 Tests)
25. `testListDestinations` — Paginated destination listing with meta.
26. `testGetDestinationById` — Single destination lookup by primary key ID.
27. `testGetDestinationBySlug` — SEO-friendly slug lookup (`/slug/goa`).
28. `testDestinationNotFound` — 404 Not Found error handling for non-existent destination.
29. `testSearchDestinationsByQuery` — Full text matching across destination name, state, and description.
30. `testListPlacesForDestination` — Child attractions for specific destination ID.
31. `testListHotels` — Paginated listing of active hotels.
32. `testFilterHotelsByDestination` — Hotel filtering constrained to destination ID.
33. `testFilterHotelsByPriceRange` — Hotel filtering by `minPrice` and `maxPrice`.
34. `testGetHotelByIdWithRooms` — Hotel details query with eager active room inventory.
35. `testListHotelRooms` — Sub-resource listing of hotel rooms.
36. `testListPackages` — Paginated travel package discovery.
37. `testFilterPackagesByDestination` — Package discovery filtered by destination ID.
38. `testFilterPackagesByPriceRange` — Package filtering within budget ranges.
39. `testGetPackageByIdWithItems` — Travel package details with day-by-day itinerary activities.
40. `testListPackageItems` — Ordered itinerary items for a specific package.
41. `testPaginationStructureCorrectness` — Page boundaries, size, total count, total pages, and last flag.
42. `testSortingFunctionality` — Ascending and descending price and star-rating sorts.
43. `testInvalidPaginationInput` — 400 Bad Request on negative page or zero size.
44. `testInvalidPriceRange` — 400 Bad Request when `minPrice > maxPrice`.
45. `testUnpublishedDestinationNotVisible` — Public exclusion of draft/unpublished destinations.
46. `testInactiveHotelAndPackageNotVisible` — Public exclusion of inactive hotels and packages.
