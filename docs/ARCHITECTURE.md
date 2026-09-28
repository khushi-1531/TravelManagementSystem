# TravelSphere — System Architecture Document
**Target Architecture Design**  
**Document Version:** 2.0.0 (Updated Post-Review)  
**Status:** Approved for Implementation Planning  

---

## 1. Executive System Overview

**TravelSphere** is an enterprise-grade, AI-powered Travel & Tourism Management Platform designed to replace the legacy Java Swing desktop system. TravelSphere decouples presentation, business logic, persistence, and external service integrations into a clean, modern, multi-tier web architecture:

1. **Frontend Presentation Tier:** React 18 Single-Page Application (SPA) bundled with Vite, styled with Tailwind CSS, utilizing React Router v6 for client-side navigation, Axios for HTTP communication, and Lucide React for modern iconography.
2. **Backend Application Tier:** Java 17/21 enterprise REST API built on Spring Boot 3.x, secured with Spring Security 6 and stateless JSON Web Tokens (JWT), using Spring Data JPA and Hibernate for data access with HikariCP connection pooling.
3. **Database Persistence Tier:** Normalized MySQL 8.x relational database adhering to Third Normal Form (3NF), enforced with primary keys, foreign keys, unique constraints, check constraints, and performance-tuned indexes.
4. **External Service Integration Tier:** Secure backend adapters for Google Places & Maps, OpenWeather, OpenAI, and Razorpay. All third-party secrets remain strictly encapsulated within the backend environment.

```
+-----------------------------------------------------------------------------------+
|                                CLIENT TIER (Browser)                              |
|                       React 18 SPA + Vite + Tailwind CSS                          |
|             (Public Discovery, Customer Portal, Admin Dashboard, AI Concierge)    |
+------------------------------------------+----------------------------------------+
                                           |
                                           | HTTPS / JSON (Bearer JWT)
                                           v
+-----------------------------------------------------------------------------------+
|                        APPLICATION TIER (Spring Boot 3.x)                         |
|                                                                                   |
|  +--------------------+   +---------------------+   +--------------------------+  |
|  |   Security Filter  |   |   REST Controllers  |   |     Service Layer        |  |
|  |  (CORS, JWT, RBAC) |-->|   - AuthController  |-->|  - AuthService           |  |
|  +--------------------+   |   - UserController  |   |  - BookingService        |  |
|                           |   - DestController  |   |  - PaymentService        |  |
|                           |   - HotelController |   |  - AIService             |  |
|                           |   - PkgController   |   |  - WeatherService        |  |
|                           |   - BookController  |   |  - PlaceService          |  |
|                           |   - PayController   |   +------------+-------------+  |
|                           |   - AIController    |                |                |
|                           |   - AdminController |                v                |
|                           +----------+----------+   +--------------------------+  |
|                                      |              |   Spring Data JPA Repos  |  |
|                                      v              +------------+-------------+  |
|                           +---------------------+                |                |
|                           |   DTOs & Mappers    |                v                |
|                           +---------------------+   +--------------------------+  |
|                                                     |   Hibernate ORM Entities |  |
|                                                     +------------+-------------+  |
+------------------------------------------------------------------|----------------+
                                                                   | HikariCP JDBC
                                                                   v
+-----------------------------------------------------------------------------------+
|                                DATABASE TIER (MySQL 8.x)                          |
|             Normalized 3NF: Users, Profiles, Destinations, Hotels, Packages,       |
|             Bookings, Hotel/Package Booking Items, Payment Attempts, Reviews      |
+-----------------------------------------------------------------------------------+
```

---

## 2. Target Folder Architecture

The future project structure preserves the existing legacy Java Swing files intact for reference while introducing the modern full-stack web application structure:

```
Travel-And-Tourism-Hub/
│
├── frontend/                                   # React + Vite Frontend Application
│   ├── public/                                 # Static public assets (favicon, logos)
│   │   ├── favicon.ico
│   │   └── robots.txt
│   ├── src/
│   │   ├── assets/                             # Bundled images, illustrations, icons
│   │   │   ├── images/
│   │   │   └── icons/
│   │   ├── components/                         # Reusable UI component library
│   │   │   ├── common/                         # Button, Input, Modal, Badge, Dropdown, Card
│   │   │   ├── navigation/                     # Navbar, Footer, Sidebar, Breadcrumbs
│   │   │   ├── booking/                        # BookingSummary, PriceBreakdown, GuestSelector
│   │   │   ├── hotel/                          # HotelCard, RoomCard, AmenityBadge
│   │   │   ├── package/                        # PackageCard, ItineraryTimeline, TierBadge
│   │   │   ├── destination/                    # DestinationCard, WeatherWidget, MapView
│   │   │   ├── ai/                             # ChatDrawer, MessageBubble, ItineraryCard
│   │   │   └── feedback/                       # Spinner, Alert, Toast, EmptyState
│   │   ├── context/                            # React Context providers (Auth, Wishlist, Theme)
│   │   │   ├── AuthContext.jsx
│   │   │   ├── WishlistContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/                              # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useBooking.js
│   │   │   ├── useDebounce.js
│   │   │   └── useFetch.js
│   │   ├── layouts/                            # Page layout wrappers
│   │   │   ├── MainLayout.jsx                  # Public & customer layout with Navbar/Footer
│   │   │   ├── AuthLayout.jsx                  # Clean centered layout for Login/Register
│   │   │   └── AdminLayout.jsx                 # Dashboard layout with admin sidebar
│   │   ├── pages/                              # Page-level route views
│   │   │   ├── public/                         # HomePage, ExplorePage, AboutPage, ContactPage
│   │   │   ├── auth/                           # LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage
│   │   │   ├── destinations/                   # DestinationListPage, DestinationDetailPage
│   │   │   ├── hotels/                         # HotelListPage, HotelDetailPage
│   │   │   ├── packages/                       # PackageListPage, PackageDetailPage
│   │   │   ├── customer/                       # ProfilePage, MyBookingsPage, BookingDetailPage, WishlistPage
│   │   │   ├── ai/                             # AIAssistantPage, TripPlannerPage
│   │   │   └── admin/                          # AdminDashboardPage, ManageUsers, ManageBookings, ManageHotels
│   │   ├── routes/                             # Route configuration & route guards
│   │   │   ├── AppRoutes.jsx                   # Central route declarations
│   │   │   ├── ProtectedRoute.jsx              # Customer JWT authentication guard
│   │   │   └── AdminRoute.jsx                  # Admin role authorization guard
│   │   ├── services/                           # HTTP API client services (Axios)
│   │   │   ├── api.js                          # Axios instance with JWT interceptors
│   │   │   ├── authService.js
│   │   │   ├── destinationService.js
│   │   │   ├── hotelService.js
│   │   │   ├── packageService.js
│   │   │   ├── bookingService.js
│   │   │   ├── paymentService.js
│   │   │   ├── reviewService.js
│   │   │   ├── weatherService.js
│   │   │   └── aiService.js
│   │   ├── utils/                              # Utility helpers and formatters
│   │   │   ├── formatters.js                   # Currency, date, time formatters
│   │   │   ├── validators.js                   # Client-side input validation rules
│   │   │   └── constants.js                    # System constants, enums, config
│   │   ├── App.jsx                             # App entry point with providers
│   │   ├── index.css                           # Tailwind CSS directives & global styling
│   │   └── main.jsx                            # React DOM mounting
│   ├── .env.example                            # Frontend environment variables template
│   ├── index.html                              # SPA HTML entry file
│   ├── package.json                            # Frontend dependencies & scripts
│   ├── postcss.config.js                       # PostCSS configuration for Tailwind
│   ├── tailwind.config.js                      # Tailwind design system configuration
│   └── vite.config.js                          # Vite build tool configuration
│
├── backend/                                    # Spring Boot 3.x REST Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/travelsphere/
│   │   │   │   ├── TravelSphereApplication.java# Main Spring Boot launcher
│   │   │   │   ├── config/                     # Application configurations
│   │   │   │   │   ├── SecurityConfig.java     # Spring Security filter chain & CORS
│   │   │   │   │   ├── WebMvcConfig.java       # MVC & interceptor configurations
│   │   │   │   │   ├── JpaAuditConfig.java     # Auditing configuration (created_at)
│   │   │   │   │   └── RestClientConfig.java   # RestClient/WebClient for external APIs
│   │   │   │   ├── controller/                 # REST Controllers (Endpoints)
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── UserController.java
│   │   │   │   │   ├── DestinationController.java
│   │   │   │   │   ├── PlaceController.java
│   │   │   │   │   ├── HotelController.java
│   │   │   │   │   ├── PackageController.java
│   │   │   │   │   ├── BookingController.java
│   │   │   │   │   ├── PaymentController.java
│   │   │   │   │   ├── ReviewController.java
│   │   │   │   │   ├── WishlistController.java
│   │   │   │   │   ├── WeatherController.java
│   │   │   │   │   ├── AIController.java
│   │   │   │   │   └── AdminController.java
│   │   │   │   ├── service/                    # Business logic interfaces & implementations
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── UserService.java
│   │   │   │   │   ├── DestinationService.java
│   │   │   │   │   ├── PlaceService.java
│   │   │   │   │   ├── HotelService.java
│   │   │   │   │   ├── PackageService.java
│   │   │   │   │   ├── BookingService.java
│   │   │   │   │   ├── PaymentService.java
│   │   │   │   │   ├── ReviewService.java
│   │   │   │   │   ├── WishlistService.java
│   │   │   │   │   ├── WeatherService.java
│   │   │   │   │   ├── AIService.java
│   │   │   │   │   ├── NotificationService.java
│   │   │   │   │   └── impl/                   # Service implementation classes
│   │   │   │   ├── repository/                 # Spring Data JPA Repositories
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   ├── RoleRepository.java
│   │   │   │   │   ├── CustomerProfileRepository.java
│   │   │   │   │   ├── DestinationRepository.java
│   │   │   │   │   ├── PlaceRepository.java
│   │   │   │   │   ├── HotelRepository.java
│   │   │   │   │   ├── HotelRoomRepository.java
│   │   │   │   │   ├── PackageRepository.java
│   │   │   │   │   ├── PackageItemRepository.java
│   │   │   │   │   ├── BookingRepository.java
│   │   │   │   │   ├── HotelBookingItemRepository.java
│   │   │   │   │   ├── PackageBookingItemRepository.java
│   │   │   │   │   ├── PaymentAttemptRepository.java
│   │   │   │   │   ├── ReviewRepository.java
│   │   │   │   │   ├── WishlistRepository.java
│   │   │   │   │   ├── PasswordResetTokenRepository.java
│   │   │   │   │   ├── ChatSessionRepository.java
│   │   │   │   │   ├── ChatMessageRepository.java
│   │   │   │   │   └── NotificationRepository.java
│   │   │   │   ├── entity/                     # JPA Hibernate Entities
│   │   │   │   │   ├── enums/                  # System Enums (BookingStatus, RoleType, etc.)
│   │   │   │   │   ├── BaseEntity.java         # MappedSuperclass with timestamps & ID
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── Role.java
│   │   │   │   │   ├── CustomerProfile.java    # Non-sensitive profile details
│   │   │   │   │   ├── Destination.java
│   │   │   │   │   ├── Place.java
│   │   │   │   │   ├── Hotel.java
│   │   │   │   │   ├── HotelRoom.java
│   │   │   │   │   ├── PackageTour.java
│   │   │   │   │   ├── PackageItem.java
│   │   │   │   │   ├── Booking.java
│   │   │   │   │   ├── HotelBookingItem.java   # Strict non-null FK to HotelRoom
│   │   │   │   │   ├── PackageBookingItem.java # Strict non-null FK to PackageTour
│   │   │   │   │   ├── PaymentAttempt.java     # 1:N payment attempts
│   │   │   │   │   ├── Review.java
│   │   │   │   │   ├── Wishlist.java
│   │   │   │   │   ├── PasswordResetToken.java
│   │   │   │   │   ├── ChatSession.java
│   │   │   │   │   ├── ChatMessage.java
│   │   │   │   │   └── Notification.java
│   │   │   │   ├── dto/                        # Data Transfer Objects
│   │   │   │   │   ├── request/                # Inbound request bodies
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   │   ├── ForgotPasswordRequest.java
│   │   │   │   │   │   ├── ResetPasswordRequest.java
│   │   │   │   │   │   ├── ChangePasswordRequest.java
│   │   │   │   │   │   ├── ProfileUpdateRequest.java
│   │   │   │   │   │   ├── BookingCreateRequest.java
│   │   │   │   │   │   ├── PaymentVerifyRequest.java
│   │   │   │   │   │   ├── ReviewCreateRequest.java
│   │   │   │   │   │   └── AIChatRequest.java
│   │   │   │   │   └── response/               # Outbound JSON responses
│   │   │   │   │       ├── ApiResponse.java    # Generic envelope wrapper
│   │   │   │   │       ├── AuthResponse.java
│   │   │   │   │       ├── UserResponse.java
│   │   │   │   │       ├── DestinationResponse.java
│   │   │   │   │       ├── HotelResponse.java
│   │   │   │   │       ├── PackageResponse.java
│   │   │   │   │       ├── BookingResponse.java
│   │   │   │   │       ├── PaymentOrderResponse.java
│   │   │   │   │       ├── WeatherResponse.java
│   │   │   │   │       └── AIChatResponse.java
│   │   │   │   ├── security/                   # Spring Security & JWT components
│   │   │   │   │   ├── JwtTokenProvider.java
│   │   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   │   ├── JwtAuthenticationEntryPoint.java
│   │   │   │   │   ├── CustomUserDetailsService.java
│   │   │   │   │   ├── AdminInitializationRunner.java # Secure env-driven admin setup
│   │   │   │   │   └── UserPrincipal.java
│   │   │   │   ├── exception/                  # Exception Handling
│   │   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   │   ├── ResourceNotFoundException.java
│   │   │   │   │   ├── BadRequestException.java
│   │   │   │   │   ├── UnauthorizedException.java
│   │   │   │   │   ├── PaymentException.java
│   │   │   │   │   └── ErrorDetails.java
│   │   │   │   ├── mapper/                     # Entity-to-DTO conversion mappers
│   │   │   │   │   ├── UserMapper.java
│   │   │   │   │   ├── DestinationMapper.java
│   │   │   │   │   ├── HotelMapper.java
│   │   │   │   │   ├── PackageMapper.java
│   │   │   │   │   └── BookingMapper.java
│   │   │   │   └── util/                       # Helper utilities (HMAC verification, calculations)
│   │   │   │       ├── SecurityUtils.java
│   │   │   │       └── AppConstants.java
│   │   │   └── resources/
│   │   │       ├── application.yml             # Main Spring Boot configuration
│   │   │       ├── application-dev.yml         # Development profile
│   │   │       └── application-prod.yml        # Production profile
│   │   └── test/                               # JUnit & Mockito unit/integration tests
│   │       └── java/com/travelsphere/
│   └── pom.xml                                 # Maven dependencies & build plugins
│
├── database/                                   # Database migration & schema definitions
│   ├── schema.sql                              # Normalized 3NF DDL creation script (v2.0)
│   └── seed.sql                                # Clean initial catalog seed script (v2.0)
│
├── docs/                                       # Project documentation
│   ├── ARCHITECTURE.md                         # This architecture specification
│   ├── DATABASE_DESIGN.md                      # Schema, tables, relationships, indexes
│   ├── API_DESIGN.md                           # REST API endpoint contracts
│   ├── SECURITY_DESIGN.md                      # Security model & vulnerability remediations
│   └── PROJECT_AUDIT.md                        # Read-only audit of legacy system
│
├── [Existing Java Swing Project - Preserved]   # (Unmodified legacy files for reference)
│   ├── src code-travel & tourism hub/
│   ├── data_base/
│   ├── Images/
│   ├── nbproject/
│   └── build.xml
│
├── .gitignore
└── README.md
```

---

## 3. Backend Layered Architecture

The Spring Boot backend enforces a strict unidirectional layered architecture:

```
[ HTTP Request: JSON + JWT ]
            │
            ▼
┌───────────────────────────────────────┐
│           SECURITY FILTER             │  Validates JWT signature, claims, and expiry
│      (JwtAuthenticationFilter)        │  Populates SecurityContext with UserPrincipal
└──────────────────┬────────────────────┘
                   │
                   ▼
┌───────────────────────────────────────┐
│          CONTROLLER LAYER             │  Handles HTTP requests, path variables, query params
│    (@RestController, @Validated)      │  Enforces Jakarta Bean Validation on DTOs
└──────────────────┬────────────────────┘
                   │ Pass Request DTOs
                   ▼
┌───────────────────────────────────────┐
│            SERVICE LAYER              │  Implements business logic, transaction management
│     (@Service, @Transactional)        │  Calculates pricing, orchestrates state transitions
└──────────────────┬────────────────────┘  Calls External Adapters (OpenAI, Razorpay, Weather)
                   │ Manipulates Entities
                   ▼
┌───────────────────────────────────────┐
│          REPOSITORY LAYER             │  Abstracts database persistence using Spring Data JPA
│        (JpaRepository<T, ID>)         │  Executes parameterized queries and criteria queries
└──────────────────┬────────────────────┘
                   │ ORM SQL Queries
                   ▼
┌───────────────────────────────────────┐
│            DATABASE LAYER             │  MySQL 8.x executing indexed, constraint-backed DDL
│           (MySQL 8.x Engine)          │  Ensures ACID transactions and relational integrity
└───────────────────────────────────────┘
```

---

## 4. Frontend Route Architecture

The React SPA utilizes React Router v6 with nested layout routes and route guards:

| Route Path | View / Component | Layout | Access Level | Description |
|---|---|---|---|---|
| `/` | `HomePage` | `MainLayout` | Public | Hero banner, popular destinations, curated packages, search bar |
| `/explore` | `ExplorePage` | `MainLayout` | Public | Interactive search and filtering across destinations, hotels, and packages |
| `/destinations` | `DestinationListPage` | `MainLayout` | Public | Grid of all travel destinations with category filters |
| `/destinations/:id` | `DestinationDetailPage` | `MainLayout` | Public | Deep dive into a destination: overview, places, weather, hotels, packages |
| `/hotels` | `HotelListPage` | `MainLayout` | Public | Hotel directory with price range, rating, and amenity filters |
| `/hotels/:id` | `HotelDetailPage` | `MainLayout` | Public | Hotel details, available room types, live price calculator, reviews |
| `/packages` | `PackageListPage` | `MainLayout` | Public | Catalog of tour packages with duration, price, and tier filters |
| `/packages/:id` | `PackageDetailPage` | `MainLayout` | Public | Detailed day-by-day itinerary, inclusions/exclusions, tier selection |
| `/login` | `LoginPage` | `AuthLayout` | Guest Only | Username/email and password login form |
| `/register` | `RegisterPage` | `AuthLayout` | Guest Only | User registration form with validation |
| `/forgot-password` | `ForgotPasswordPage`| `AuthLayout` | Guest Only | Request password reset token via registered email |
| `/reset-password` | `ResetPasswordPage` | `AuthLayout` | Guest Only | Submit new password using secure reset token |
| `/profile` | `ProfilePage` | `MainLayout` | Customer (JWT) | View and update customer personal details and contact address |
| `/wishlist` | `WishlistPage` | `MainLayout` | Customer (JWT) | Saved destinations, hotels, and tour packages |
| `/my-bookings` | `MyBookingsPage` | `MainLayout` | Customer (JWT) | Tabbed booking history (Active, Completed, Cancelled) |
| `/my-bookings/:id`| `BookingDetailPage` | `MainLayout` | Customer (JWT) | Full booking voucher, payment attempts receipt, cancel action |
| `/ai-assistant` | `AIAssistantPage` | `MainLayout` | Customer (JWT) | Conversational AI chat concierge for travel Q&A |
| `/trip-planner` | `TripPlannerPage` | `MainLayout` | Customer (JWT) | AI-powered automated itinerary generator |
| `/admin` | `AdminDashboardPage`| `AdminLayout`| Admin (ROLE_ADMIN)| Metrics: total revenue, active bookings, user counts, charts |
| `/admin/users` | `ManageUsersPage` | `AdminLayout`| Admin (ROLE_ADMIN)| User directory, status toggle (active/inactive), role management |
| `/admin/destinations`|`ManageDestinations`| `AdminLayout`| Admin (ROLE_ADMIN)| CRUD destination manager with photo uploads |
| `/admin/hotels` | `ManageHotelsPage` | `AdminLayout`| Admin (ROLE_ADMIN)| CRUD hotel & room inventory manager |
| `/admin/packages` | `ManagePackagesPage`| `AdminLayout`| Admin (ROLE_ADMIN)| CRUD package & itinerary schedule manager |
| `/admin/bookings` | `ManageBookingsPage`| `AdminLayout`| Admin (ROLE_ADMIN)| View all platform bookings, manual status moderation |
| `/admin/payments` | `ManagePaymentsPage`| `AdminLayout`| Admin (ROLE_ADMIN)| Transaction ledger with Razorpay reconciliation status |

---

## 5. Booking Model & State Machine

The booking lifecycle manages both hotel room reservations and package tour bookings through a finite state machine:

```
               [ User Submits Booking Request ]
                               │
                               ▼
                        ┌──────────────┐
                        │   PENDING    │  Temporary hold on room / seats
                        └──────┬───────┘  (Auto-expires after 15 minutes)
                               │
            ┌──────────────────┴──────────────────┐
            │ Initiate Payment Attempt            │ User Cancels or 15m Timeout
            ▼                                     ▼
 ┌──────────────────────┐                 ┌───────────────┐
 │   PAYMENT_PENDING    │                 │   CANCELLED   │
 └──────────┬───────────┘                 └───────────────┘
            │
    ┌───────┴──────────────────────────────┐
    │ Razorpay Webhook/Verification SUCCESS│ Payment FAILED or CANCELLED
    ▼                                      ▼
┌──────────────┐                  ┌─────────────────────────────────┐
│  CONFIRMED   │                  │ Remains PAYMENT_PENDING         │
└──────┬───────┘                  │ (Customer can retry new attempt │
       │                          │  until 15m window expires)      │
       │ Travel Date Passes       └─────────────────────────────────┘
       ▼
┌──────────────┐
│  COMPLETED   │
└──────────────┘
```

### State Definitions & Trigger Events:
1. **`PENDING`:**
   - Customer submits dates and room/package selections. System computes price on backend, validates room availability, generates a unique `booking_reference` (e.g., `TS-2026-98124`), and sets state to `PENDING`.
   - Inventory hold expires automatically after 15 minutes if no payment attempt is started.
2. **`PAYMENT_PENDING`:**
   - Triggered when `/api/v1/payments/create-order` is called. A new `payment_attempts` record is inserted with `status = 'INITIATED'` and Razorpay `order_id`.
   - If payment attempt 1 fails or is closed, its status becomes `FAILED` or `CANCELLED` with a recorded `failure_reason`. The booking remains `PAYMENT_PENDING`, permitting subsequent attempts.
3. **`CONFIRMED`:**
   - Triggered when a payment attempt receives verified cryptographic confirmation (`HMAC-SHA256`).
   - That payment attempt becomes `SUCCESS`. The booking transitions to `CONFIRMED`, inventory is definitively reserved, and confirmation notifications are dispatched.
4. **`CANCELLED`:**
   - Triggered if the customer manually cancels prior to check-in or if the 15-minute booking window lapses without any successful payment.
5. **`COMPLETED`:**
   - Automated nightly job transitions confirmed bookings to `COMPLETED` once travel/check-out dates have passed.

---

## 6. Payment Architecture: 1:N Payment Attempts Model

```
[ Customer Browser ]         [ Spring Boot Backend ]          [ Razorpay API ]
        │                               │                            │
        │ 1. POST /api/v1/payments/create-order                      │
        │──────────────────────────────>│                            │
        │                               │ 2. Create Razorpay Order   │
        │                               │───────────────────────────>│
        │                               │ 3. Return order_id         │
        │                               │<───────────────────────────│
        │                               │ 4. Insert payment_attempts │
        │                               │    (status: INITIATED)     │
        │ 5. Return Order Details       │                            │
        │<──────────────────────────────│                            │
        │                                                            │
        │ 6. Customer attempts checkout modal                        │
        │    [Attempt 1 Fails: Card Declined / Modal Closed]         │
        │                                                            │
        │ 7. Webhook / Client notifies failure                       │
        │──────────────────────────────>│                            │
        │                               │ 8. Update Attempt 1        │
        │                               │    (status: FAILED)        │
        │                                                            │
        │ 9. Customer clicks "Retry Payment"                         │
        │    POST /api/v1/payments/create-order                      │
        │──────────────────────────────>│                            │
        │                               │ 10. Insert Attempt 2       │
        │                               │     (status: INITIATED)    │
        │ 11. Modal Opens & Succeeds    │                            │
        │                                                            │
        │ 12. POST /api/v1/payments/verify                           │
        │──────────────────────────────>│                            │
        │                               │ 13. Pessimistic Lock on    │
        │                               │     Booking (SELECT FOR    │
        │                               │     UPDATE)                │
        │                               │ 14. Verify HMAC-SHA256     │
        │                               │ 15. Check no prior SUCCESS │
        │                               │ 16. Update Attempt 2       │
        │                               │     (status: SUCCESS)      │
        │                               │ 17. Booking -> CONFIRMED   │
        │ 18. Return Booking Voucher    │                            │
        │<──────────────────────────────│                            │
```

### Prevention of Duplicate Successful Payments:
1. **Engine-Level Unique Constraint:**
   ```sql
   UNIQUE KEY uq_one_success_per_booking (booking_id, (CASE WHEN status = 'SUCCESS' THEN 'SUCCESS' ELSE NULL END))
   ```
   Ensures that no matter how many concurrent requests or duplicate webhooks fire, the database engine will reject a second `SUCCESS` record for the same booking.
2. **Pessimistic Concurrency Lock:**
   The backend locks the `Booking` entity during verification (`LockModeType.PESSIMISTIC_WRITE`). If a booking is already in `CONFIRMED` status, any secondary payment capture triggers an alert and an automatic refund call through the Razorpay Refund API.

---

## 7. AI Services Architecture

TravelSphere integrates OpenAI models strictly through backend orchestration services:

### 1. AI Travel Assistant (`/api/v1/ai/chat`)
- Frontend submits user prompt alongside optional `sessionUuid`.
- Backend loads conversation history from `chat_messages` (last 10 turns for context memory).
- System instruction: *"You are TravelSphere Concierge, a helpful, knowledgeable travel assistant. Provide accurate, inspiring advice on destinations, clothing, local customs, and itinerary ideas."*
- Calls OpenAI Chat Completion API (`gpt-4o-mini`).
- Stores response in `chat_messages` and returns sanitized text to user.

### 2. AI Trip Planner (`/api/v1/ai/itinerary`)
- User specifies: Destination, Number of Days (1-14), Budget Tier (Budget, Moderate, Luxury), Interests, and Travelers.
- Backend requests strict JSON structured output from OpenAI conforming to a validated itinerary schema.
- Backend validates response structure before returning to frontend for interactive timeline rendering.

---

## 8. External API Architecture & Secrets Management

```
                                  +-----------------------------+
                                  |     React 18 Frontend       |
                                  +--------------+--------------+
                                                 |
                                                 | HTTPS Calls
                                                 v
+-----------------------------------------------------------------------------------------------+
|                               Spring Boot Backend (API Gateway)                               |
|                                                                                               |
|  +---------------------+   +---------------------+   +------------------+   +--------------+  |
|  | GooglePlacesAdapter |   | OpenWeatherAdapter  |   |  OpenAIAdapter   |   | RazorpayUtil |  |
|  +----------+----------+   +----------+----------+   +--------+---------+   +-------+------+  |
+-------------|-------------------------|-----------------------|---------------------|---------+
              |                         |                       |                     |
              | Secret:                 | Secret:               | Secret:             | Secret:
              | GOOGLE_MAPS_API_KEY     | OPENWEATHER_API_KEY   | OPENAI_API_KEY      | RAZORPAY_KEY_SECRET
              v                         v                       v                     v
     +-----------------+       +-----------------+     +-----------------+   +-----------------+
     |  Google Places  |       |   OpenWeather   |     |   OpenAI API    |   |  Razorpay API   |
     |     API         |       |       API       |     |                 |   |                 |
     +-----------------+       +-----------------+     +-----------------+   +-----------------+
```

### Initial Administrator Setup & Secrets Management:
1. **Zero Hardcoded Passwords:** No default admin password is committed to source control or seed files.
2. **Environment Variable Injection:**
   ```yaml
   app:
     admin:
       initial-username: ${TRAVELSPHERE_INITIAL_ADMIN_USERNAME:}
       initial-email: ${TRAVELSPHERE_INITIAL_ADMIN_EMAIL:}
       initial-password: ${TRAVELSPHERE_INITIAL_ADMIN_PASSWORD:}
     services:
       openai:
         api-key: ${OPENAI_API_KEY:}
       openweather:
         api-key: ${OPENWEATHER_API_KEY:}
       google:
         maps-api-key: ${GOOGLE_MAPS_API_KEY:}
       razorpay:
         key-id: ${RAZORPAY_KEY_ID:}
         key-secret: ${RAZORPAY_KEY_SECRET:}
   ```
3. **Mandatory First-Login Password Change:** The initial admin account is created with `requires_password_change = TRUE`. When the administrator logs in, any request to administrative functions requires updating the password first.
