# TravelSphere — Security Architecture & Threat Modeling Document
**Target Security Design**  
**Document Version:** 2.0.0 (Updated Post-Review)  
**Status:** Approved for Implementation Planning  

---

## 1. Remediation Matrix: Legacy Audit Vulnerabilities vs. TravelSphere Defense

This matrix explicitly maps every critical and high-severity security vulnerability identified in `PROJECT_AUDIT.md` to its architectural defense in TravelSphere:

| Legacy Defect (from Audit) | Legacy Vulnerable File | Attack Vector / Risk | TravelSphere Defense Mechanism | Technical Implementation |
|---|---|---|---|---|
| **SQL Injection in Login** | `Login.java` (L104) | Query concatenation: `' OR '1'='1` bypasses login. | Parameterized queries via Spring Data JPA & Spring Security `DaoAuthenticationProvider`. | Hibernate binds parameters as typed values; raw concatenation is strictly prohibited. |
| **SQL Injection in CRUD** | `Signup.java`, `AddCustomer.java`, `BookHotel.java`, etc. | Unescaped string injection in all INSERT/UPDATE statements. | Type-safe ORM entity persistence via `JpaRepository.save(entity)`. | Zero raw SQL statements; entity fields are bound via JDBC PreparedStatement under the hood. |
| **Plaintext Passwords in Database** | `database_...sql`, `Signup.java` | Credentials readable directly from database dumps. | Adaptive slow one-way password hashing using **BCrypt**. | Spring Security `BCryptPasswordEncoder(12)` with per-user cryptographic salt. |
| **Plaintext Password in GUI** | `Login.java` (L56) | Passwords typed into a `JTextField` are visible on screen. | Modern HTML `<input type="password">` in React frontend. | Client-side password masking with optional user-toggled reveal. |
| **Plaintext Password Recovery** | `ForgetPassword.java` (L136) | Cleartext password fetched from DB and rendered on screen. | Cryptographically secure, single-use, expirable reset tokens sent via email. | CSPRNG 128-bit hex tokens hashed with SHA-256 in DB; 15-minute expiration; no passwords revealed. |
| **Hard-Coded Admin Credentials** | `DBConn.java` (L15-16), legacy schema | `root`/`root` or static admin passwords in source/seeds. | Environment variable-driven bootstrap runner & first-login password change mandate. | Admin initialized via `TRAVELSPHERE_INITIAL_ADMIN_...` env vars with `requires_password_change = TRUE`. Zero passwords in Git. |
| **Data Overcollection / PII Risk** | `AddCustomer.java`, `customer` table | Passports and national IDs stored without justification. | Privacy by design & data minimization. | Dropped `id_type` and `id_number` from customer profiles; only necessary contact details retained. |
| **Hard-Coded Machine Paths** | `.classpath`, `nbproject` | Absolute paths to developer machine breaking portability. | Standard Maven & NPM package management. | Dependency resolution via Maven Central (`pom.xml`) and npmjs (`package.json`). |
| **Simulated Payment Bypass** | `Payment.java`, `Paytm.java` | No actual transaction; users could browse away without paying. | Server-side cryptographic webhook verification via Razorpay SDK with 1:N payment attempts. | Backend computes HMAC-SHA256 signature; functional unique index and pessimistic locks prevent duplicate captures. |
| **Desktop Executable Invocation** | `Dashboard.java` (L245-251) | `calc.exe` and `notepad.exe` launched via `Runtime.exec`. | Completely eliminated. | Web applications execute entirely in sandboxed browser and server environments. |
| **Missing Access Control (IDOR)** | All legacy screens | Any user could view/delete other users' records by altering username. | Object-level authorization checks in the Service layer. | Spring Security `@PreAuthorize` combined with user ID ownership checks (`booking.getUser().getId() == authUser.getId()`). |

---

## 2. Authentication Architecture

### 1. Password Hashing (BCrypt)
- **Algorithm:** BCrypt with a workload factor (rounds) of `12`.
- **Properties:**
  - Automatic cryptographic salt generation per hash (stored within the modular crypt format string).
  - Resistant to rainbow table attacks and GPU-accelerated brute-force cracking.
  - Verification handled exclusively via `passwordEncoder.matches(rawPassword, encodedHash)`.

### 2. JSON Web Token (JWT) Lifecycle
- **Algorithm:** `HMAC-SHA256` (HS256) signed with a minimum 256-bit high-entropy secret string.
- **Payload Claims:**
  - `sub`: User UUID or ID
  - `username`: Account username
  - `roles`: Assigned authorities (`["ROLE_USER", "ROLE_ADMIN"]`)
  - `requiresPasswordChange`: Boolean indicating if user must change password
  - `iat`: Issue timestamp
  - `exp`: Expiration timestamp (Access token valid for **15 minutes**; Refresh token valid for **7 days**)
- **Stateless Verification Filter (`JwtAuthenticationFilter`):**
  1. Intercepts inbound HTTP requests.
  2. Extracts token from `Authorization: Bearer <token>` header.
  3. Validates signature, audience, and expiration using `JwtTokenProvider`.
  4. Loads `UserPrincipal` into Spring `SecurityContextHolder`.
  5. If token is invalid or expired, immediately aborts with `HTTP 401 Unauthorized`.

### 3. Secure Initial-Admin Setup & Mandatory Password Change
- **No Hardcoded Password:** Neither `seed.sql` nor application code contains any default administrator password.
- **Dynamic Bootstrap (`AdminInitializationRunner`):**
  - On application startup, Spring Boot checks if an administrator exists.
  - If absent, it reads `TRAVELSPHERE_INITIAL_ADMIN_USERNAME`, `TRAVELSPHERE_INITIAL_ADMIN_EMAIL`, and `TRAVELSPHERE_INITIAL_ADMIN_PASSWORD` from system environment variables.
  - It BCrypt-hashes the password, assigns `ROLE_ADMIN`, and sets `requires_password_change = TRUE`.
- **Enforced First-Login Change:**
  - When the administrator logs in, the JWT reflects `requiresPasswordChange: true`.
  - An authentication interceptor restricts the administrator to calling `POST /api/v1/auth/change-password` only. All administrative CRUD and metrics routes return `HTTP 403 Forbidden` with errorCode `PASSWORD_CHANGE_REQUIRED` until a new secure password is set.

### 4. Secure Password Reset Workflow
1. User requests reset via `POST /api/v1/auth/forgot-password` providing email.
2. System generates a 32-byte cryptographic random token using `java.security.SecureRandom`.
3. System computes `SHA-256(token)` and stores it in `password_reset_tokens` along with `expires_at = now() + 15 minutes` and `is_used = false`.
4. The raw token is sent to the user's verified email address as a one-time link: `https://travelsphere.com/reset-password?token=<RAW_TOKEN>`.
5. User submits new password with the token.
6. Backend computes `SHA-256(rawToken)`, matches it in the database, verifies `expires_at > now()` and `is_used == false`, hashes the new password with BCrypt, updates the user record, and marks the token as used.

---

## 3. Authorization & Role-Based Access Control (RBAC)

TravelSphere defines two primary security roles with strict hierarchical permissions:

```
                      +-------------------+
                      |    ROLE_ADMIN     |
                      +---------+---------+
                                | (Inherits all permissions)
                                v
                      +-------------------+
                      |     ROLE_USER     |
                      +-------------------+
```

### Permission Matrix:

| Endpoint Resource | Public (Guest) | Registered Customer (`ROLE_USER`) | Administrator (`ROLE_ADMIN`) |
|---|---|---|---|
| Browse Destinations & Places | READ | READ | READ / WRITE / DELETE |
| Browse Hotels & Packages | READ | READ | READ / WRITE / DELETE |
| View Weather Forecasts | READ | READ | READ |
| Customer Profile Management | DENIED | READ / WRITE (Own Profile Only) | READ (All Users) |
| Book Hotel or Package | DENIED | CREATE / VIEW (Own Bookings) | FULL MANAGEMENT |
| Cancel Booking | DENIED | CANCEL (Own Active Bookings) | CANCEL (Any Booking) |
| Submit Review | DENIED | CREATE (If Booking Completed) | MODERATE / DELETE |
| AI Travel Assistant | DENIED | ACCESS | ACCESS |
| Admin Analytics Dashboard | DENIED | DENIED | FULL ACCESS |

### Implementation in Spring Security:
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disabled for stateless JWT API
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/destinations/**", "/api/v1/hotels/**", "/api/v1/packages/**", "/api/v1/weather/**").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### Prevention of Insecure Direct Object References (IDOR):
In the Service layer, methods verify entity ownership before executing updates:
```java
public BookingResponse getBookingById(Long bookingId, UserPrincipal currentUser) {
    Booking booking = bookingRepository.findById(bookingId)
        .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));

    if (!booking.getUser().getId().equals(currentUser.getId()) && !currentUser.isAdmin()) {
        throw new UnauthorizedException("You do not have permission to view this booking.");
    }
    return bookingMapper.toResponse(booking);
}
```

---

## 4. Input Validation & Data Sanitization

1. **Jakarta Bean Validation on Inbound DTOs:**
   - All `@RestController` methods annotate request payloads with `@Valid`.
   - String inputs are checked with `@NotBlank`, `@Size(min, max)`, `@Pattern(regex)`.
   - Numerical values and monetary amounts use `@Positive`, `@Min`, `@Max`.
   - Dates are validated using `@FutureOrPresent` for check-ins and custom `@AssertTrue` methods verifying `checkOutDate.isAfter(checkInDate)`.
2. **Cross-Site Scripting (XSS) Prevention:**
   - User reviews, chat prompts, and profile names are sanitized using an HTML escape library (e.g., OWASP Java HTML Sanitizer).
   - In the React frontend, dynamic values are rendered using JSX standard string interpolation (`{variable}`), which natively escapes HTML entities. `dangerouslySetInnerHTML` is strictly prohibited.
3. **HTTP Parameter Pollution & Injection:**
   - Hibernate criteria queries and parameterized repository methods isolate all query parameters.
   - Paging arguments (`page`, `size`) are clamped to a maximum size of 50 to prevent Denial of Service (DoS) memory exhaustion.

---

## 5. Payment Security & Concurrency Defense

```
[ Inbound Payment Verify / Webhook ]
                 │
                 ▼
┌───────────────────────────────────────┐
│     PESSIMISTIC WRITE LOCK ACQUIRED   │  SELECT * FROM bookings WHERE id = ? FOR UPDATE
│       (Prevents Race Conditions)      │
└────────────────┬──────────────────────┘
                 │
                 ▼
┌───────────────────────────────────────┐
│     HMAC-SHA256 SIGNATURE CHECK       │  MessageDigest.isEqual(computedSignature, receivedSig)
│      (Verifies Key Secret Match)      │
└────────────────┬──────────────────────┘
                 │
        ┌────────┴────────┐
        │ Valid Signature │
        ▼                 ▼ Invalid Signature
┌──────────────────┐  ┌───────────────────────────────────────┐
│ CHECK IF ALREADY │  │   REJECT: Return HTTP 400 Bad Request │
│    CONFIRMED     │  └───────────────────────────────────────┘
└───────┬──────────┘
        │
   ┌────┴─────────────────────────────┐
   │ No prior SUCCESS payment         │ Already CONFIRMED
   ▼                                  ▼
┌─────────────────────────────────┐  ┌───────────────────────────────────┐
│ 1. Insert Payment Attempt:      │  │ 1. Reject duplicate confirmation  │
│    status = 'SUCCESS'           │  │ 2. Flag anomalous duplicate       │
│ 2. Engine-level Unique Index    │  │    transaction for Razorpay refund│
│    blocks any concurrent record │  └───────────────────────────────────┘
│ 3. Booking -> 'CONFIRMED'       │
└─────────────────────────────────┘
```

### Prevention of Duplicate Captured Payments:
1. **Engine-Level Unique Partial Index:**
   ```sql
   UNIQUE KEY uq_one_success_per_booking (booking_id, (CASE WHEN status = 'SUCCESS' THEN 'SUCCESS' ELSE NULL END))
   ```
   Ensures that only a single row with `status = 'SUCCESS'` can ever exist per booking. Any duplicate capture attempt causes a database constraint violation.
2. **Constant-Time HMAC-SHA256 Verification:**
   ```java
   public boolean verifyRazorpaySignature(String orderId, String paymentId, String receivedSignature) {
       try {
           String payload = orderId + "|" + paymentId;
           Mac mac = Mac.getInstance("HmacSHA256");
           SecretKeySpec secretKey = new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
           mac.init(secretKey);
           byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
           String computedSignature = Hex.encodeHexString(hash);

           // Constant-time comparison to prevent timing side-channel attacks
           return MessageDigest.isEqual(computedSignature.getBytes(), receivedSignature.getBytes());
       } catch (Exception e) {
           log.error("Error verifying payment signature", e);
           return false;
       }
   }
   ```

---

## 6. External Secrets Management

```
+-------------------------------------------------------------------------------+
|                            SECURITY BOUNDARY: SERVER                          |
|                                                                               |
|  .env / OS Environment:                                                       |
|  • TRAVELSPHERE_DB_PASSWORD                                                   |
|  • TRAVELSPHERE_INITIAL_ADMIN_PASSWORD                                        |
|  • RAZORPAY_KEY_SECRET                                                        |
|  • OPENAI_API_KEY                                                             |
|  • OPENWEATHER_API_KEY                                                        |
|  • GOOGLE_MAPS_API_KEY                                                        |
|                         │                                                     |
|                         ▼                                                     |
|          Spring Boot Application (Environment Injected)                       |
+-------------------------+-----------------------------------------------------+
                          |
                          | Sanitized Public Data (No Secrets)
                          v
+-------------------------------------------------------------------------------+
|                        SECURITY BOUNDARY: CLIENT BROWSER                      |
|                                                                               |
|  React Frontend contains ONLY:                                                |
|  • VITE_API_BASE_URL (e.g., https://api.travelsphere.com)                     |
|  • VITE_RAZORPAY_KEY_ID (Public merchant key only)                            |
+-------------------------------------------------------------------------------+
```

---

## 7. Network, CORS & Security Headers

### 1. Cross-Origin Resource Sharing (CORS)
- Wildcards (`"*"`) combined with credentials (`allowCredentials = true`) are strictly forbidden.
- Allowed origins are explicitly whitelisted via configuration:
  - Local Development: `http://localhost:5173` (Vite dev server)
  - Production: `https://travelsphere.com`
- Permitted HTTP Methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
- Permitted Headers: `Authorization`, `Content-Type`, `Accept`.

### 2. HTTP Security Response Headers
Spring Security is configured to automatically emit defensive HTTP headers on every response:
- **`Strict-Transport-Security` (HSTS):** `max-age=31536000; includeSubDomains` (enforces HTTPS).
- **`X-Content-Type-Options`:** `nosniff` (prevents MIME-type sniffing).
- **`X-Frame-Options`:** `DENY` (prevents clickjacking attacks).
- **`Content-Security-Policy` (CSP):** `default-src 'self'; img-src 'self' data: https:; script-src 'self' https://checkout.razorpay.com;`
- **`Referrer-Policy`:** `strict-origin-when-cross-origin`.
