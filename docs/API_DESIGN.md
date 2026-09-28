# TravelSphere — REST API Specification Document
**Target API Architecture**  
**Document Version:** 2.0.0 (Updated Post-Review)  
**Status:** Approved for Implementation Planning  
**Base URL:** `/api/v1`  

---

## 1. Global API Standards

### Headers
- `Content-Type: application/json` (Required on mutating requests)
- `Accept: application/json`
- `Authorization: Bearer <JWT_TOKEN>` (Required on all protected endpoints)

### Standard Success Response Envelope (`ApiResponse<T>`)
Every successful endpoint response returns a standardized JSON payload:
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "timestamp": "2026-09-21T18:00:00.000Z"
}
```

### Standard Error Response Envelope (`ApiErrorResponse`)
```json
{
  "success": false,
  "errorCode": "RESOURCE_NOT_FOUND",
  "message": "Hotel with ID '42' was not found.",
  "validationErrors": [
    { "field": "email", "message": "Email must be a valid email format" }
  ],
  "timestamp": "2026-09-21T18:00:00.000Z",
  "path": "/api/v1/hotels/42"
}
```

### Standard Pagination Response Envelope (`PageResponse<T>`)
```json
{
  "content": [],
  "page": 0,
  "size": 10,
  "totalElements": 85,
  "totalPages": 9,
  "last": false
}
```

---

## 2. Authentication & Authorization Endpoints

### `POST /api/v1/auth/register`
- **Purpose:** Create a new customer user account.
- **Auth Requirement:** Public
- **Request Body:**
  ```json
  {
    "username": "johndoe",
    "email": "john.doe@example.com",
    "password": "SecurePassword123!",
    "fullName": "John Doe"
  }
  ```
- **Validation Rules:**
  - `username`: Not blank, 3–30 characters, alphanumeric only.
  - `email`: Not blank, valid email format.
  - `password`: Not blank, min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special symbol.
  - `fullName`: Not blank, max 100 chars.
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "data": {
      "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "roles": ["ROLE_USER"]
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/auth/login`
- **Purpose:** Authenticate credentials and obtain JWT access token.
- **Auth Requirement:** Public
- **Request Body:**
  ```json
  {
    "usernameOrEmail": "johndoe",
    "password": "SecurePassword123!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Authentication successful.",
    "data": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresInSeconds": 86400,
      "requiresPasswordChange": false,
      "user": {
        "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
        "username": "johndoe",
        "email": "john.doe@example.com",
        "fullName": "John Doe",
        "roles": ["ROLE_USER"]
      }
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/auth/forgot-password`
- **Purpose:** Request a secure password reset token via email.
- **Auth Requirement:** Public
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "If the email exists in our system, a password reset link has been dispatched.",
    "data": null,
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/auth/reset-password`
- **Purpose:** Set a new password using a verified single-use reset token.
- **Auth Requirement:** Public
- **Request Body:**
  ```json
  {
    "token": "d8f37a6b9c1e4f2a7b5d8c3e1a9b4f2c",
    "newPassword": "NewSecurePassword456!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password has been successfully updated. Please login with your new credentials.",
    "data": null,
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/auth/change-password`
- **Purpose:** Change password for authenticated users (mandatory for initial admin on first login).
- **Auth Requirement:** Authenticated User or Admin (Bearer JWT)
- **Request Body:**
  ```json
  {
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewStrongPassword789!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Password changed successfully. Requires password change flag cleared.",
    "data": null,
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

## 3. User & Profile Endpoints (Data Minimization Applied)

### `GET /api/v1/users/me`
- **Purpose:** Retrieve currently authenticated user's account and non-sensitive contact profile.
- **Auth Requirement:** Customer (Bearer JWT)
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "User profile retrieved.",
    "data": {
      "uuid": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "username": "johndoe",
      "email": "john.doe@example.com",
      "fullName": "John Doe",
      "requiresPasswordChange": false,
      "roles": ["ROLE_USER"],
      "profile": {
        "phoneCountryCode": "+91",
        "phoneNumber": "9876543210",
        "addressLine": "Flat 402, Royal Palms",
        "city": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "postalCode": "400001",
        "avatarUrl": "https://cdn.travelsphere.com/avatars/user1.png"
      }
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `PUT /api/v1/users/me`
- **Purpose:** Update authenticated user's personal details and contact address.
- **Auth Requirement:** Customer (Bearer JWT)
- **Request Body:**
  ```json
  {
    "fullName": "Johnathan Doe",
    "phoneCountryCode": "+91",
    "phoneNumber": "9876543210",
    "addressLine": "Flat 402, Royal Palms",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "postalCode": "400001",
    "avatarUrl": "https://cdn.travelsphere.com/avatars/user1.png"
  }
  ```
- **Response (200 OK):** Updated user and profile object.

---

## 4. Destination & Place Endpoints

### `GET /api/v1/destinations`
- **Purpose:** Retrieve paginated and filterable list of travel destinations.
- **Auth Requirement:** Public
- **Query Parameters:** `query`, `featured`, `page`, `size`
- **Response (200 OK):** `ApiResponse<PageResponse<DestinationSummaryDTO>>`

---

### `GET /api/v1/destinations/{id}`
- **Purpose:** Retrieve full destination details including attractions, hotels, and packages.
- **Auth Requirement:** Public

---

### `GET /api/v1/places/search`
- **Purpose:** Search attractions and points of interest across destinations.
- **Auth Requirement:** Public
- **Query Parameters:** `q`, `category`

---

### `GET /api/v1/places/{id}`
- **Purpose:** Get attraction details, description, entry fees, and hours.
- **Auth Requirement:** Public

---

### `GET /api/v1/places/nearby`
- **Purpose:** Find nearby attractions given a latitude and longitude (calls Google Places via backend proxy).
- **Auth Requirement:** Public
- **Query Parameters:** `lat`, `lng`, `radiusMeters`

---

## 5. Hotel & Room Endpoints

### `GET /api/v1/hotels`
- **Purpose:** Search and filter hotel accommodations.
- **Auth Requirement:** Public
- **Query Parameters:** `destinationId`, `minPrice`, `maxPrice`, `starRating`, `hasPool`, `hasWifi`, `hasParking`, `page`, `size`

---

### `GET /api/v1/hotels/{id}`
- **Purpose:** Retrieve complete hotel profile, amenities, photos, reviews, and available room inventory tiers.
- **Auth Requirement:** Public
- **Response (200 OK):** Returns hotel data including nested `rooms` array (`STANDARD`, `DELUXE`, `SUITE` with price, occupancy, and AC info).

---

## 6. Tour Package Endpoints

### `GET /api/v1/packages`
- **Purpose:** Browse curated travel tour packages.
- **Auth Requirement:** Public
- **Query Parameters:** `destinationId`, `tier` (`BRONZE`, `SILVER`, `GOLD`), `maxDurationDays`, `page`, `size`

---

### `GET /api/v1/packages/{id}`
- **Purpose:** Get comprehensive tour package details including day-by-day itinerary schedule (`package_items`) and inclusions.
- **Auth Requirement:** Public

---

## 7. Booking Endpoints (Dedicated Item Relational Integrity)

### `POST /api/v1/bookings`
- **Purpose:** Create a new hotel or package reservation in `PENDING` status.
- **Auth Requirement:** Customer (Bearer JWT)
- **Request Body (Hotel Room Booking):**
  ```json
  {
    "bookingType": "HOTEL",
    "hotelRoomId": 3,
    "checkInDate": "2026-10-15",
    "checkOutDate": "2026-10-18",
    "guestsCount": 2,
    "roomsCount": 1,
    "customerNotes": "High floor room preferred."
  }
  ```
- **Request Body (Tour Package Booking):**
  ```json
  {
    "bookingType": "PACKAGE",
    "packageId": 1,
    "startDate": "2026-11-01",
    "guestsCount": 2,
    "customerNotes": "Vegetarian meal preference."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "success": true,
    "message": "Booking initiated successfully. Please complete payment within 15 minutes.",
    "data": {
      "bookingReference": "TS-2026-89102",
      "bookingType": "HOTEL",
      "status": "PENDING",
      "totalAmount": 15600.00,
      "currency": "INR",
      "createdAt": "2026-09-21T18:00:00.000Z",
      "paymentExpiresAt": "2026-09-21T18:15:00.000Z"
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `GET /api/v1/bookings`
- **Purpose:** List all bookings for the authenticated user.
- **Auth Requirement:** Customer (Bearer JWT)
- **Query Parameters:** `status`, `page`, `size`

---

### `GET /api/v1/bookings/{id}`
- **Purpose:** Retrieve detailed booking voucher by ID or reference string, including relational line items.
- **Auth Requirement:** Customer (Bearer JWT - verified against ownership) or Admin
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Booking details retrieved.",
    "data": {
      "bookingReference": "TS-2026-89102",
      "bookingType": "HOTEL",
      "status": "CONFIRMED",
      "totalAmount": 15600.00,
      "currency": "INR",
      "createdAt": "2026-09-21T18:00:00.000Z",
      "hotelItems": [
        {
          "roomType": "DELUXE",
          "hotelName": "JW Marriott Hotel",
          "checkInDate": "2026-10-15",
          "checkOutDate": "2026-10-18",
          "roomsCount": 1,
          "guestsCount": 2,
          "pricePerNight": 5200.00,
          "subtotal": 15600.00
        }
      ],
      "packageItems": []
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/bookings/{id}/cancel`
- **Purpose:** Cancel a pending or confirmed booking.
- **Auth Requirement:** Customer (Owner) or Admin

---

## 8. Payment Endpoints (1:N Payment Attempts Model)

### `POST /api/v1/payments/create-order`
- **Purpose:** Initiate a payment attempt by creating a Razorpay order on the backend for a specific booking.
- **Auth Requirement:** Customer (Bearer JWT)
- **Request Body:**
  ```json
  {
    "bookingReference": "TS-2026-89102"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment attempt created and Razorpay order generated.",
    "data": {
      "attemptReference": "e3b0c442-98fc-1c14-9afb-f4c596297074",
      "orderId": "order_EKfUsjf8912Jka",
      "amountInSubunits": 1560000,
      "currency": "INR",
      "keyId": "rzp_test_public_key_here",
      "bookingReference": "TS-2026-89102"
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/payments/verify`
- **Purpose:** Cryptographically verify Razorpay signature and capture payment. Single-success guarantee enforced via functional unique index and pessimistic write lock.
- **Auth Requirement:** Customer (Bearer JWT)
- **Request Body:**
  ```json
  {
    "attemptReference": "e3b0c442-98fc-1c14-9afb-f4c596297074",
    "razorpayOrderId": "order_EKfUsjf8912Jka",
    "razorpayPaymentId": "pay_29A107xDqW175q",
    "razorpaySignature": "9ef42640451699bcb7196d3f7c750791e16a83f0"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment verified and booking confirmed.",
    "data": {
      "bookingReference": "TS-2026-89102",
      "bookingStatus": "CONFIRMED",
      "paymentStatus": "SUCCESS",
      "paymentId": "pay_29A107xDqW175q",
      "attemptReference": "e3b0c442-98fc-1c14-9afb-f4c596297074"
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `POST /api/v1/payments/fail`
- **Purpose:** Report a failed or cancelled payment attempt with diagnostic failure reason, allowing the customer to retry.
- **Auth Requirement:** Customer (Bearer JWT)
- **Request Body:**
  ```json
  {
    "attemptReference": "e3b0c442-98fc-1c14-9afb-f4c596297074",
    "failureReason": "Bank payment gateway timeout or card declined by issuer."
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Payment attempt marked as failed. You may retry payment within the booking window.",
    "data": {
      "bookingReference": "TS-2026-89102",
      "attemptStatus": "FAILED",
      "canRetry": true
    },
    "timestamp": "2026-09-21T18:00:00.000Z"
  }
  ```

---

### `GET /api/v1/bookings/{id}/payment-attempts`
- **Purpose:** List all payment attempts (failed, cancelled, and successful) associated with a booking.
- **Auth Requirement:** Customer (Owner) or Admin
- **Response (200 OK):** Array of payment attempts with status, provider order ID, failure reason, and timestamps.

---

## 9. Review & Wishlist Endpoints

### `GET /api/v1/reviews`
- **Purpose:** Get reviews for a target entity.
- **Query Parameters:** `targetType` (`DESTINATION`, `HOTEL`, `PACKAGE`), `targetId`, `page`, `size`
- **Auth Requirement:** Public

### `POST /api/v1/reviews`
- **Purpose:** Post customer review and 1-5 rating.
- **Auth Requirement:** Customer (Bearer JWT - must have completed booking)

### `GET /api/v1/wishlist`
- **Purpose:** List authenticated user's saved wishlist items.
- **Auth Requirement:** Customer (Bearer JWT)

### `POST /api/v1/wishlist`
- **Purpose:** Add destination, hotel, or package to wishlist.
- **Auth Requirement:** Customer (Bearer JWT)

### `DELETE /api/v1/wishlist/{id}`
- **Purpose:** Remove item from wishlist.
- **Auth Requirement:** Customer (Bearer JWT)

---

## 10. Live Weather & AI Endpoints

### `GET /api/v1/weather`
- **Purpose:** Get current weather and 5-day forecast for a destination city.
- **Auth Requirement:** Public
- **Query Parameters:** `city`, `countryCode`

### `POST /api/v1/ai/chat`
- **Purpose:** Multi-turn conversational travel assistant.
- **Auth Requirement:** Customer (Bearer JWT)

### `POST /api/v1/ai/itinerary`
- **Purpose:** Generate automated, customized day-by-day itinerary plans.
- **Auth Requirement:** Customer (Bearer JWT)

---

## 11. Admin Endpoints (`ROLE_ADMIN` Only)

### `GET /api/v1/admin/dashboard`
- **Purpose:** Aggregate executive KPI metrics.
- **Auth Requirement:** Admin (JWT + `ROLE_ADMIN`)

### `GET /api/v1/admin/users`
- **Purpose:** Paginated user management table with search and status toggle.
- **Auth Requirement:** Admin (JWT + `ROLE_ADMIN`)

### `GET /api/v1/admin/bookings`
- **Purpose:** Global booking management across all users with status moderation.
- **Auth Requirement:** Admin (JWT + `ROLE_ADMIN`)

### CRUD `/api/v1/admin/destinations`
- `POST` / `PUT` / `DELETE` for destination catalog management.

### CRUD `/api/v1/admin/hotels`
- `POST` / `PUT` / `DELETE` for hotels and room inventory management.

### CRUD `/api/v1/admin/packages`
- `POST` / `PUT` / `DELETE` for tour packages and itinerary item schedules.
