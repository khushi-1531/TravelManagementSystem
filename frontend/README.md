# TravelSphere — Modern React Frontend

> **Tagline:** Discover places. Plan better. Travel smarter.

This is the modernized, commercial-grade Single Page Application (SPA) for **TravelSphere**. Built with React 18, Vite 5, Tailwind CSS, Lucide React icons, and Axios, it directly consumes the Spring Boot 3 + MySQL catalogue and authentication REST APIs.

---

## 1. Technology Stack

- **Framework:** React 18 (Functional Components, Hooks, Context API)
- **Tooling & Bundler:** Vite 5
- **Routing:** React Router v6 (`react-router-dom`)
- **Styling:** Tailwind CSS v3 with custom travel theme palette
- **Icons:** Lucide React (`lucide-react`)
- **HTTP Client:** Axios with JWT request/response interceptors

---

## 2. Directory Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── .env
├── README.md
└── src/
    ├── components/
    │   ├── Navbar.jsx             # Responsive brand navbar with mobile drawer & auth controls
    │   ├── Footer.jsx             # Informative multi-column travel footer
    │   ├── HeroSection.jsx        # Landing hero banner with universal discovery search
    │   ├── SearchBar.jsx          # Search bar with entity category filter
    │   ├── FilterPanel.jsx        # Reusable filter sidebar with badge counters
    │   ├── DestinationCard.jsx    # Card with featured badges, season tags & explore link
    │   ├── PlaceCard.jsx          # Card with category chip, hours & entry fee
    │   ├── HotelCard.jsx          # Card with star rating, amenities icons & starting price
    │   ├── PackageCard.jsx        # Card with tier badge, duration & inclusions
    │   ├── RoomCard.jsx           # Detailed room inventory card with amenities
    │   ├── ItineraryTimeline.jsx  # Day-by-day tour milestones timeline
    │   ├── LoadingState.jsx       # Skeleton loaders
    │   ├── ErrorState.jsx         # User-friendly error message with retry action
    │   ├── EmptyState.jsx         # Clean empty state with filter reset action
    │   └── ProtectedRoute.jsx     # Route guard for authenticated areas
    ├── context/
    │   └── AuthContext.jsx        # Global auth session, JWT tokens, profile state
    ├── layouts/
    │   └── MainLayout.jsx         # Core app frame (Navbar + Outlet + Footer)
    ├── pages/
    │   ├── Home.jsx               # Landing page with discovery, featured items, USP
    │   ├── Destinations.jsx       # Paginated destinations directory with filters & sort
    │   ├── DestinationDetails.jsx # Detailed destination overview with places/hotels/packages tabs
    │   ├── Places.jsx             # Sights and attractions catalog with category filters
    │   ├── Hotels.jsx             # Hotel listings with price, rating & destination filters
    │   ├── HotelDetails.jsx       # Property amenities, contacts, and room configurations
    │   ├── Packages.jsx           # Tour packages with tier, duration & budget filters
    │   ├── PackageDetails.jsx     # Day-by-day itinerary timeline and inclusions
    │   ├── Login.jsx              # Customer login form with identifier and password
    │   ├── Register.jsx           # Account registration with client-side validation
    │   ├── Profile.jsx            # Authenticated user details & profile updater
    │   ├── About.jsx              # About TravelSphere, architecture & mission
    │   └── NotFound.jsx           # 404 error page with safe fallback links
    ├── services/
    │   ├── api.js                 # Centralized Axios instance with interceptors
    │   ├── authApi.js             # Authentication & user profile endpoints
    │   ├── destinationApi.js      # Destination catalog endpoints
    │   ├── placeApi.js            # Places and attractions endpoints
    │   ├── hotelApi.js            # Hotel and room inventory endpoints
    │   ├── packageApi.js          # Travel packages and itinerary endpoints
    │   ├── bookingApi.js          # Booking reservations management endpoints
    │   ├── paymentApi.js          # Payment orders and HMAC verification endpoints
    │   └── chatApi.js             # AI Travel Assistant message & session endpoints
    ├── utils/
    │   ├── formatters.js          # Currency, duration, and date formatters
    │   └── imageFallback.js       # Curated fallback photography and error handling
    ├── App.jsx                    # Application routing configuration
    ├── index.css                  # Tailwind directives and custom utility classes
    └── main.jsx                   # React root entry point
```

---

## 3. Environment Variables

Create `.env` based on `.env.example`:

```bash
# TravelSphere Backend REST API Base URL
VITE_API_BASE_URL=http://localhost:8081/api/v1
```

---

## 4. Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` or `v24+`
- npm `v9+` or `v10+` or `v11+`
- Spring Boot backend running on port `8081`

### Installation
```bash
cd frontend
npm install
```

### Running Development Server
```bash
npm run dev
```
The application will start at:
```
http://localhost:5173
```

### Building for Production
```bash
npm run build
```
Generates optimized static assets in `frontend/dist/`.

### Previewing Production Build
```bash
npm run preview
```

---

## 5. Application Routes

| Route | Description | Protection |
|---|---|---|
| `/` | Landing page with Hero, Search, Featured Destinations, Hotels & Packages | Public |
| `/destinations` | All destinations with search, state/country filter, sorting & pagination | Public |
| `/destinations/:id` | Destination detail with tabs for Places, Hotels, Packages | Public |
| `/places` | Tourist places with destination & category filtering | Public |
| `/hotels` | Hotels directory with star rating, price range & sort | Public |
| `/hotels/:id` | Hotel detail with amenities, room configurations & nightly rates | Public |
| `/packages` | Holiday packages with tier, duration, budget filters | Public |
| `/packages/:id` | Package detail with day-by-day itinerary timeline, inclusions & reservation modal | Public |
| `/bookings` | Authenticated customer bookings dashboard with status filtering | **Protected** |
| `/bookings/:id` | Detailed booking reservation summary with cancellation action | **Protected** |
| `/bookings/confirmation/:id` | Booking registration confirmation card & reference generator | **Protected** |
| `/bookings/:id/payment` | Secure payment checkout with Razorpay SDK & order creation | **Protected** |
| `/bookings/:id/payment/success` | Post-payment verified confirmation with receipt reference | **Protected** |
| `/bookings/:id/payment/failed` | Graceful payment failure recovery and retry interface | **Protected** |
| `/assistant` | AI Travel Assistant with TravelSphere catalogue context & history | Public / Semi-Protected |
| `/about` | About the platform and modern architecture | Public |
| `/login` | User login (username or email) | Public |
| `/register` | Account registration | Public |
| `/profile` | Authenticated customer profile & account details | **Protected** |
| `*` | 404 page | Public |

---

## 6. Backend Integration

The frontend connects directly to the TravelSphere Spring Boot 3 backend:
- Default API Base: `http://localhost:8081/api/v1`
- JWT Access token automatically attached to all authenticated requests via Axios interceptors.
- **Booking APIs:**
  - `POST /api/v1/bookings`: Create booking (Hotel or Package) with backend-authoritative price calculation and availability locking.
  - `GET /api/v1/bookings`: List paginated reservations for current user.
  - `GET /api/v1/bookings/{id}`: Detailed booking breakdown with ownership enforcement.
  - `POST /api/v1/bookings/{id}/cancel`: Cancellation lifecycle (releases inventory).
- No mock/fake responses used in React; all catalogue and reservation states reflect database integrity.
- Graceful Loading, Error, and Empty states handled across all screens.
