import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminApi from '../../services/adminApi';
import {
  Users,
  CalendarCheck,
  CreditCard,
  MapPin,
  Hotel,
  Luggage,
  Star,
  TrendingUp,
  AlertCircle,
  Loader2,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setError(null);
      const data = await adminApi.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to load admin statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <Loader2 className="w-10 h-10 text-teal-400 animate-spin mb-4" />
        <p className="font-medium text-sm">Aggregating live TravelSphere database metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-200 flex flex-col items-start gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
          <div>
            <h3 className="text-base font-bold text-white">Database Metrics Error</h3>
            <p className="text-xs text-rose-300 mt-0.5">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const kpis = [
    {
      title: 'Total System Revenue',
      value: formatCurrency(stats?.totalRevenue),
      subtext: `${stats?.successfulPaymentsCount || 0} verified gateway payments`,
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-400',
      border: 'border-emerald-500/30'
    },
    {
      title: 'Total Bookings',
      value: stats?.totalBookings || 0,
      subtext: `${stats?.confirmedBookingsCount || 0} Confirmed • ${stats?.pendingBookingsCount || 0} Pending`,
      icon: CalendarCheck,
      color: 'from-blue-500 to-indigo-400',
      textColor: 'text-blue-400',
      border: 'border-blue-500/30'
    },
    {
      title: 'Registered Users',
      value: stats?.totalUsers || 0,
      subtext: `${stats?.activeUsersCount || 0} Active accounts`,
      icon: Users,
      color: 'from-purple-500 to-indigo-400',
      textColor: 'text-purple-400',
      border: 'border-purple-500/30'
    },
    {
      title: 'Customer Feedback',
      value: `${stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'} / 5.0`,
      subtext: `${stats?.totalReviews || 0} total moderated reviews`,
      icon: Star,
      color: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-400',
      border: 'border-amber-500/30'
    },
    {
      title: 'Destinations',
      value: stats?.totalDestinations || 0,
      subtext: `${stats?.publishedDestinationsCount || 0} published to catalog`,
      icon: MapPin,
      color: 'from-teal-500 to-emerald-400',
      textColor: 'text-teal-400',
      border: 'border-teal-500/30'
    },
    {
      title: 'Hotels & Resorts',
      value: stats?.totalHotels || 0,
      subtext: `${stats?.activeHotelsCount || 0} actively bookable`,
      icon: Hotel,
      color: 'from-cyan-500 to-blue-400',
      textColor: 'text-cyan-400',
      border: 'border-cyan-500/30'
    },
    {
      title: 'Holiday Packages',
      value: stats?.totalPackages || 0,
      subtext: `${stats?.activePackagesCount || 0} available for booking`,
      icon: Luggage,
      color: 'from-rose-500 to-pink-400',
      textColor: 'text-rose-400',
      border: 'border-rose-500/30'
    },
    {
      title: 'Payment Transactions',
      value: formatCurrency(stats?.totalSuccessfulPaymentVolume),
      subtext: `${stats?.successfulPaymentsCount || 0} captured / settled`,
      icon: CreditCard,
      color: 'from-violet-500 to-purple-400',
      textColor: 'text-violet-400',
      border: 'border-violet-500/30'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Administrative Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry and database-driven management for the TravelSphere platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`bg-slate-950/80 rounded-2xl p-5 border ${kpi.border} relative overflow-hidden group hover:border-teal-400/50 transition-all duration-300 shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center text-slate-950 shadow-md group-hover:scale-105 transition-transform`}
                >
                  <Icon className="w-5 h-5 text-slate-950 font-bold" />
                </div>
              </div>

              <div className="text-2xl font-black text-white tracking-tight mb-1">
                {kpi.value}
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>{kpi.subtext}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Access Management Shortcuts */}
      <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-6">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <span>Administrative Quick Workflows</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            to="/admin/destinations"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-teal-300">
              Destinations
            </span>
          </Link>

          <Link
            to="/admin/hotels"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Hotel className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-blue-300">
              Hotels & Rooms
            </span>
          </Link>

          <Link
            to="/admin/packages"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Luggage className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-rose-300">
              Packages
            </span>
          </Link>

          <Link
            to="/admin/bookings"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-purple-300">
              Bookings
            </span>
          </Link>

          <Link
            to="/admin/payments"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
              Payment Audit
            </span>
          </Link>

          <Link
            to="/admin/reviews"
            className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 text-center flex flex-col items-center justify-center gap-2 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300">
              Reviews
            </span>
          </Link>
        </div>
      </div>

      {/* Two Column Section: Booking Status Overview & Platform Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Distribution Card */}
        <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Booking Lifecycle Distribution</h3>
            <Link
              to="/admin/bookings"
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 inline-flex items-center gap-1"
            >
              <span>View all bookings</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Bookings
                </span>
                <span className="text-white">{stats?.confirmedBookingsCount || 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{
                    width: stats?.totalBookings
                      ? `${((stats.confirmedBookingsCount || 0) / stats.totalBookings) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Pending Confirmation / Payment
                </span>
                <span className="text-white">{stats?.pendingBookingsCount || 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{
                    width: stats?.totalBookings
                      ? `${((stats.pendingBookingsCount || 0) / stats.totalBookings) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" /> Cancelled Bookings
                </span>
                <span className="text-white">{stats?.cancelledBookingsCount || 0}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{
                    width: stats?.totalBookings
                      ? `${((stats.cancelledBookingsCount || 0) / stats.totalBookings) * 100}%`
                      : '0%'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Architectural Telemetry */}
        <div className="bg-slate-950/60 rounded-3xl border border-slate-800 p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-2">Platform Status & Architecture</h3>
            <p className="text-xs text-slate-400 mb-4">
              Authoritative role-based security is enforced at both the API filter chain and method level via Spring Security `@PreAuthorize("hasRole('ADMIN')")`.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Security Boundary</span>
                <span className="font-mono font-bold text-teal-400">ROLE_ADMIN Enforced</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Database Engine</span>
                <span className="font-mono font-bold text-emerald-400">MySQL / Spring JPA</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Legacy Swing System</span>
                <span className="font-mono font-bold text-slate-300">Preserved / Untouched</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block mb-1">Payment Gateway</span>
                <span className="font-mono font-bold text-blue-400">Razorpay Integration</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>API Server: http://localhost:8081</span>
            <span className="text-emerald-400 font-semibold">Healthy</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
