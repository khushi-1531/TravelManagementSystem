import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  Hotel,
  Search,
  Plus,
  Edit2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  RefreshCw,
  Star,
  MapPin
} from 'lucide-react';

export const AdminHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Available destinations for selection dropdown
  const [destinationsList, setDestinationsList] = useState([]);
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const [formData, setFormData] = useState({
    destinationId: '',
    name: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    starRating: 4,
    pricePerNightMin: '',
    pricePerNightMax: '',
    imageUrl: '',
    amenities: '',
    isActive: true
  });

  const loadDestinations = async () => {
    try {
      const res = await adminApi.getDestinations({ page: 0, size: 100 });
      setDestinationsList(res.content || []);
    } catch {
      // Non-blocking
    }
  };

  const fetchHotels = async (pageToFetch = page, destFilter = selectedDestinationFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getHotels({
        destinationId: destFilter ? parseInt(destFilter, 10) : undefined,
        page: pageToFetch,
        size: 10
      });
      setHotels(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve hotels.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  useEffect(() => {
    fetchHotels(page, selectedDestinationFilter);
  }, [page, selectedDestinationFilter]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      destinationId: destinationsList[0]?.id || '',
      name: '',
      description: '',
      address: '',
      city: '',
      state: '',
      country: 'India',
      starRating: 4,
      pricePerNightMin: '',
      pricePerNightMax: '',
      imageUrl: '',
      amenities: 'Wi-Fi, Swimming Pool, Spa, Restaurant, Room Service',
      isActive: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (hotel) => {
    setModalMode('edit');
    setEditingId(hotel.id);
    setFormData({
      destinationId: hotel.destinationId || hotel.destination?.id || '',
      name: hotel.name || '',
      description: hotel.description || '',
      address: hotel.address || '',
      city: hotel.city || '',
      state: hotel.state || '',
      country: hotel.country || 'India',
      starRating: hotel.starRating || 4,
      pricePerNightMin: hotel.pricePerNightMin ?? '',
      pricePerNightMax: hotel.pricePerNightMax ?? '',
      imageUrl: hotel.imageUrl || '',
      amenities: Array.isArray(hotel.amenities)
        ? hotel.amenities.join(', ')
        : hotel.amenities || '',
      isActive: hotel.isActive !== false
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.destinationId) {
      setModalError('Hotel Name and Associated Destination are required.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const amenitiesArray = formData.amenities
        ? formData.amenities
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        ...formData,
        destinationId: parseInt(formData.destinationId, 10),
        starRating: parseInt(formData.starRating, 10),
        pricePerNightMin: formData.pricePerNightMin !== '' ? parseFloat(formData.pricePerNightMin) : null,
        pricePerNightMax: formData.pricePerNightMax !== '' ? parseFloat(formData.pricePerNightMax) : null,
        amenities: amenitiesArray
      };

      if (modalMode === 'create') {
        await adminApi.createHotel(payload);
        setActionSuccess(`Hotel "${formData.name}" created successfully.`);
      } else {
        await adminApi.updateHotel(editingId, payload);
        setActionSuccess(`Hotel "${formData.name}" updated successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchHotels(page, selectedDestinationFilter);
    } catch (err) {
      setModalError(err.message || 'Failed to save hotel.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (hotel) => {
    const nextState = !hotel.isActive;
    const actionDesc = nextState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionDesc} "${hotel.name}"?`)) return;

    try {
      const updated = await adminApi.toggleHotelActive(hotel.id);
      setHotels((prev) =>
        prev.map((h) => (h.id === hotel.id ? { ...h, isActive: updated.isActive } : h))
      );
      setActionSuccess(`"${hotel.name}" is now ${nextState ? 'active' : 'inactive'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to toggle hotel status.');
    }
  };

  const formatPrice = (val) => {
    if (val === null || val === undefined) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Hotel className="w-6 h-6 text-teal-400" />
            <span>Hotels & Accommodations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage luxury resorts, heritage stays, star ratings, and inventory status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchHotels(page, selectedDestinationFilter)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-teal-500/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hotel</span>
          </button>
        </div>
      </div>

      {/* Action Notification */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs text-slate-400 font-semibold whitespace-nowrap">
            Filter Destination:
          </label>
          <select
            value={selectedDestinationFilter}
            onChange={(e) => {
              setSelectedDestinationFilter(e.target.value);
              setPage(0);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:border-teal-500 outline-none"
          >
            <option value="">All Destinations</option>
            {destinationsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.state})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{hotels.length}</span> of{' '}
          <span className="text-white font-semibold">{totalElements}</span> accommodations
        </div>
      </div>

      {/* Hotels Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Hotel Property</th>
                <th className="py-3.5 px-4 sm:px-6">Destination / City</th>
                <th className="py-3.5 px-4 sm:px-6">Rating</th>
                <th className="py-3.5 px-4 sm:px-6">Nightly Range</th>
                <th className="py-3.5 px-4 sm:px-6">Active</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading hotels from database...</span>
                  </td>
                </tr>
              ) : hotels.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No accommodations found. Click "Add Hotel" to register one.
                  </td>
                </tr>
              ) : (
                hotels.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={h.imageUrl || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop'}
                          alt={h.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <div className="font-bold text-white">{h.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {h.address || h.city}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{h.destinationName || h.city || 'Regional'}</span>
                      </div>
                      <div className="text-xs text-slate-400">{h.state || h.country}</div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="inline-flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{h.starRating || 4} Star</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-semibold text-xs">
                        {formatPrice(h.pricePerNightMin)}
                        {h.pricePerNightMax ? ` – ${formatPrice(h.pricePerNightMax)}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          h.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            h.isActive !== false ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        ></span>
                        {h.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(h)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          title="Edit Hotel"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(h)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            h.isActive !== false
                              ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                          }`}
                          title={h.isActive !== false ? 'Deactivate Stay' : 'Activate Stay'}
                        >
                          {h.isActive !== false ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Page <span className="text-white font-semibold">{page + 1}</span> of{' '}
              <span className="text-white font-semibold">{totalPages}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hotel Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Hotel className="w-5 h-5 text-teal-400" />
                <span>{modalMode === 'create' ? 'Add New Accommodation' : 'Edit Hotel Property'}</span>
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Destination <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="destinationId"
                    value={formData.destinationId}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  >
                    <option value="">Select Destination...</option>
                    {destinationsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hotel Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. The Himalayan Resort & Spa"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="e.g. Hadimba Road, Log Huts Area"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleFormChange}
                    placeholder="e.g. Manali"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Star Rating</label>
                  <select
                    name="starRating"
                    value={formData.starRating}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  >
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <option key={stars} value={stars}>
                        {stars} Star{stars > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Min Price (₹ / night)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerNightMin"
                    value={formData.pricePerNightMin}
                    onChange={handleFormChange}
                    placeholder="e.g. 3500"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Price (₹ / night)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="pricePerNightMax"
                    value={formData.pricePerNightMax}
                    onChange={handleFormChange}
                    placeholder="e.g. 8500"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Image URL</label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleFormChange}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Amenities (comma separated)
                  </label>
                  <input
                    type="text"
                    name="amenities"
                    value={formData.amenities}
                    onChange={handleFormChange}
                    placeholder="Wi-Fi, Swimming Pool, Mountain View, Spa, Buffet Breakfast"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Description</label>
                  <textarea
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Highlight features, room amenities, and location..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="isActive" className="text-slate-300 font-medium cursor-pointer">
                    Keep accommodation active and open for customer bookings
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-teal-500/20 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{modalMode === 'create' ? 'Create Hotel' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHotels;
