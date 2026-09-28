import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Destinations from './pages/Destinations';
import DestinationDetails from './pages/DestinationDetails';
import Places from './pages/Places';
import Hotels from './pages/Hotels';
import HotelDetails from './pages/HotelDetails';
import Packages from './pages/Packages';
import PackageDetails from './pages/PackageDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import BookingDetails from './pages/BookingDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import PaymentPage from './pages/PaymentPage';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import About from './pages/About';
import TravelAssistant from './pages/TravelAssistant';
import ExploreMap from './pages/ExploreMap';
import Wishlist from './pages/Wishlist';
import NotFound from './pages/NotFound';

// Admin Layout & Pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDestinations from './pages/admin/AdminDestinations';
import AdminHotels from './pages/admin/AdminHotels';
import AdminPackages from './pages/admin/AdminPackages';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Discovery Routes */}
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:id" element={<DestinationDetails />} />
        <Route path="explore" element={<ExploreMap />} />
        <Route path="map" element={<ExploreMap />} />
        <Route path="places" element={<Places />} />
        <Route path="hotels" element={<Hotels />} />
        <Route path="hotels/:id" element={<HotelDetails />} />
        <Route path="packages" element={<Packages />} />
        <Route path="packages/:id" element={<PackageDetails />} />
        <Route path="assistant" element={<TravelAssistant />} />
        <Route path="travel-assistant" element={<TravelAssistant />} />
        <Route path="about" element={<About />} />

        {/* Authentication Routes */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />

        {/* Protected Customer Routes */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/confirmation/:id"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/:id/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/:id/payment/success"
          element={
            <ProtectedRoute>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="bookings/:id/payment/failed"
          element={
            <ProtectedRoute>
              <PaymentFailure />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Protected Admin Console Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin={true}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="destinations" element={<AdminDestinations />} />
        <Route path="hotels" element={<AdminHotels />} />
        <Route path="packages" element={<AdminPackages />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="reviews" element={<AdminReviews />} />
      </Route>
    </Routes>
  );
};

export default App;
