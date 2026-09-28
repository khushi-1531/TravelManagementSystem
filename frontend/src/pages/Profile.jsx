import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authApi from '../services/authApi';
import { 
  User, 
  Mail, 
  Shield, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  LogOut, 
  Edit3, 
  Save, 
  X, 
  Loader2,
  AlertCircle,
  Heart,
  CalendarCheck,
  ShieldCheck
} from 'lucide-react';

export const Profile = () => {
  const { user, isAdmin, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phoneNumber: user?.profile?.phoneNumber || '',
    address: user?.profile?.address || '',
    city: user?.profile?.city || '',
    state: user?.profile?.state || '',
    country: user?.profile?.country || '',
    postalCode: user?.profile?.postalCode || '',
    passportNumber: user?.profile?.passportNumber || ''
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: '' });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ type: null, message: '' });

    try {
      await authApi.updateProfile(formData);
      await refreshProfile();
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      {/* Header card */}
      <div className="bg-brand-navy rounded-3xl p-8 sm:p-10 text-white shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-black">{user?.fullName || user?.username}</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {user?.status || 'ACTIVE'}
                </span>
              </div>
              <p className="text-slate-300 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                {user?.email}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                @{user?.username} • Roles: {user?.roles?.join(', ') || 'ROLE_CUSTOMER'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors border border-slate-700"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-900/60 hover:bg-rose-900 text-rose-200 text-xs font-semibold rounded-xl transition-colors border border-rose-800"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`mb-6 p-4 rounded-2xl text-xs sm:text-sm flex items-center gap-2.5 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Admin Access Quick Banner */}
      {isAdmin && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950 border border-teal-500/40 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Administrator Access Enabled</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500 text-slate-950 uppercase tracking-wider">
                  ROLE_ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You have system administrator privileges to manage users, catalogue items, bookings, and payments.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-md shrink-0 hover:scale-105"
          >
            <span>Launch Admin Console &rarr;</span>
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/wishlist"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-rose-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500 text-rose-500" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-rose-600 transition-colors">
                My Wishlist
              </h3>
              <p className="text-xs text-slate-500">View your saved travel destinations & stays</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
            View &rarr;
          </span>
        </Link>

        <Link
          to="/bookings"
          className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 hover:border-teal-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm group-hover:text-teal-600 transition-colors">
                My Bookings
              </h3>
              <p className="text-xs text-slate-500">Track and manage reservations & payments</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-teal-600 group-hover:translate-x-0.5 transition-transform">
            View &rarr;
          </span>
        </Link>
      </div>

      {/* Profile Details or Edit Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Shield className="w-5 h-5 text-teal-600" />
          <span>Account & Customer Profile</span>
        </h2>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Address Line</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Street / Apartment / Landmark"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="e.g. Mumbai"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Maharashtra"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="e.g. India"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  placeholder="400001"
                  className="w-full text-xs sm:text-sm p-2.5 border border-slate-200 rounded-xl outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Username</span>
              <p className="font-semibold text-slate-800">{user?.username}</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Email Address</span>
              <p className="font-semibold text-slate-800">{user?.email}</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Full Name</span>
              <p className="font-semibold text-slate-800">{user?.fullName || 'Not specified'}</p>
            </div>

            <div>
              <span className="text-xs text-slate-400 block font-medium mb-1">Phone Number</span>
              <p className="font-semibold text-slate-800">{user?.profile?.phoneNumber || 'Not provided'}</p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-xs text-slate-400 block font-medium mb-1">Residential Address</span>
              <p className="font-semibold text-slate-800">
                {user?.profile?.address
                  ? `${user.profile.address}, ${user.profile.city || ''}, ${user.profile.state || ''} ${user.profile.postalCode || ''}, ${user.profile.country || ''}`
                  : 'No address on file. Click "Edit Profile" to update.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
