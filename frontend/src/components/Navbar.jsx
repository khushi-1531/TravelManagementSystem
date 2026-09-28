import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Compass, 
  Menu, 
  X, 
  User, 
  CalendarCheck,
  LogOut, 
  Search, 
  MapPin, 
  Hotel, 
  Luggage, 
  Landmark, 
  Info,
  Sparkles,
  Map,
  Heart,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Destinations', path: '/destinations', icon: MapPin },
    { name: 'Explore Map', path: '/explore', icon: Map },
    { name: 'Hotels', path: '/hotels', icon: Hotel },
    { name: 'Packages', path: '/packages', icon: Luggage },
    { name: 'Places', path: '/places', icon: Landmark },
    { name: 'AI Assistant', path: '/assistant', icon: Sparkles },
    { name: 'About', path: '/about', icon: Info },
  ];

  const getNavLinkClass = ({ isActive }) =>
    isActive
      ? 'text-teal-400 font-semibold text-sm transition-colors'
      : 'text-slate-300 hover:text-white font-medium text-sm transition-colors';

  return (
    <header className="sticky top-0 z-50 bg-brand-navy border-b border-slate-800/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2.5 group"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-200">
              <Compass className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-white leading-none">
                TRAVEL<span className="text-teal-400">SPHERE</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-medium mt-0.5">
                Modern Discovery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink key={link.path} to={link.path} className={getNavLinkClass}>
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls (Auth & Actions) */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/destinations"
              aria-label="Search destinations"
              className="p-2 text-slate-300 hover:text-teal-400 hover:bg-slate-800/60 rounded-xl transition-colors"
            >
              <Search className="w-5 h-5" />
            </Link>

            {isAuthenticated && (
              <Link
                to="/wishlist"
                aria-label="View wishlist"
                className="p-2 text-slate-300 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5" />
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold transition-colors shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Admin Console</span>
              </Link>
            )}

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-white text-sm font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center text-white text-xs font-bold">
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="max-w-[120px] truncate">{user?.fullName || user?.username}</span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1.5 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100 text-xs text-slate-500 truncate">
                      Signed in as <strong className="text-slate-800 block truncate">{user?.email}</strong>
                    </div>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm bg-teal-50 hover:bg-teal-100 font-bold text-teal-800 transition-colors border-b border-teal-100"
                      >
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        Admin Console
                      </Link>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-teal-600" />
                      My Profile
                    </Link>
                    <Link
                      to="/wishlist"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                    >
                      <Heart className="w-4 h-4 text-rose-500" />
                      My Wishlist
                    </Link>
                    <Link
                      to="/bookings"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 font-medium text-slate-700 transition-colors"
                    >
                      <CalendarCheck className="w-4 h-4 text-teal-600" />
                      My Bookings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-rose-50 font-medium text-rose-600 transition-colors text-left border-t border-slate-100 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md hover:shadow-teal-500/20 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-6 space-y-4">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-500/10 text-teal-400 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 text-teal-400" />
                  {link.name}
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-800">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-xs text-slate-400">
                  Signed in as <strong className="text-white">{user?.fullName || user?.username}</strong>
                </div>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold text-teal-300 bg-teal-950/60 border border-teal-800/80 hover:bg-teal-900/60 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-teal-400" />
                    Admin Console
                  </Link>
                )}
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  <User className="w-4 h-4 text-teal-400" />
                  Profile Settings
                </Link>
                <Link
                  to="/wishlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  <Heart className="w-4 h-4 text-rose-400" />
                  My Wishlist
                </Link>
                <Link
                  to="/bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-slate-800"
                >
                  <CalendarCheck className="w-4 h-4 text-teal-400" />
                  My Bookings
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-slate-800 text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 rounded-xl shadow-md"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
