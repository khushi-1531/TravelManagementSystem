import React, { useState } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Hotel,
  Luggage,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  Compass,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  User,
  ArrowLeft
} from 'lucide-react';

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Destinations', path: '/admin/destinations', icon: MapPin },
    { name: 'Hotels', path: '/admin/hotels', icon: Hotel },
    { name: 'Packages', path: '/admin/packages', icon: Luggage },
    { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  ];

  // Helper to determine current section name for breadcrumbs
  const currentNav = navItems.find((item) =>
    item.end ? location.pathname === item.path : location.pathname.startsWith(item.path)
  );

  return (
    <div className="min-h-screen bg-slate-900 flex text-slate-100 font-sans">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
              <ShieldCheck className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="font-black tracking-tight text-white text-base leading-tight">
                TRAVEL<span className="text-teal-400">SPHERE</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-teal-400/90">
                Admin Console
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin User Info Card */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-sm">
            {user?.fullName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="overflow-hidden flex-1">
            <div className="text-xs font-bold text-white truncate">
              {user?.fullName || user?.username}
            </div>
            <div className="text-[11px] text-teal-400 font-medium">Administrator</div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Management
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-lg shadow-teal-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800/80 space-y-2">
          <Link
            to="/"
            className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-400" />
              <span>Customer Portal</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3.5 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-20 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
                Admin
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-teal-400 font-semibold">
                {currentNav?.name || 'Overview'}
              </span>
            </div>
          </div>

          {/* Quick Header Badges / Status */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Backend (8081)
            </span>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors border border-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Back to Customer Hub</span>
              <span className="sm:hidden">App</span>
            </Link>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto bg-slate-900/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
