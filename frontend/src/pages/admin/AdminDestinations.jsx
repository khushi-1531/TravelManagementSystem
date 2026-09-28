import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  MapPin,
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
  Globe
} from 'lucide-react';

const CATEGORIES = [
  'BEACH',
  'HILL_STATION',
  'HISTORICAL',
  'WILDLIFE',
  'CULTURAL',
  'ADVENTURE',
  'PILGRIMAGE',
  'URBAN',
  'NATURE'
];

export const AdminDestinations = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    state: '',
    country: 'India',
    category: 'HILL_STATION',
    imageUrl: '',
    latitude: '',
    longitude: '',
    bestTimeToVisit: '',
    isPublished: true
  });

  const fetchDestinations = async (pageToFetch = page, query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getDestinations({
        query: query || undefined,
        page: pageToFetch,
        size: 10
      });
      setDestinations(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve destinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations(page, searchQuery);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchDestinations(0, searchQuery);
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      state: '',
      country: 'India',
      category: 'HILL_STATION',
      imageUrl: '',
      latitude: '',
      longitude: '',
      bestTimeToVisit: '',
      isPublished: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (dest) => {
    setModalMode('edit');
    setEditingId(dest.id);
    setFormData({
      name: dest.name || '',
      description: dest.description || '',
      state: dest.state || '',
      country: dest.country || 'India',
      category: dest.category || 'HILL_STATION',
      imageUrl: dest.imageUrl || '',
      latitude: dest.latitude !== null && dest.latitude !== undefined ? dest.latitude : '',
      longitude: dest.longitude !== null && dest.longitude !== undefined ? dest.longitude : '',
      bestTimeToVisit: dest.bestTimeToVisit || '',
      isPublished: dest.isPublished !== false
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
    if (!formData.name.trim() || !formData.state.trim() || !formData.country.trim()) {
      setModalError('Destination Name, State, and Country are required.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);
      const payload = {
        ...formData,
        latitude: formData.latitude !== '' ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude !== '' ? parseFloat(formData.longitude) : null
      };

      if (modalMode === 'create') {
        await adminApi.createDestination(payload);
        setActionSuccess(`Destination "${formData.name}" created successfully.`);
      } else {
        await adminApi.updateDestination(editingId, payload);
        setActionSuccess(`Destination "${formData.name}" updated successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchDestinations(page, searchQuery);
    } catch (err) {
      setModalError(err.message || 'Failed to save destination.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (dest) => {
    const nextState = !dest.isPublished;
    const actionDesc = nextState ? 'publish' : 'unpublish';
    if (!window.confirm(`Are you sure you want to ${actionDesc} "${dest.name}"?`)) return;

    try {
      const updated = await adminApi.toggleDestinationPublish(dest.id);
      setDestinations((prev) =>
        prev.map((d) => (d.id === dest.id ? { ...d, isPublished: updated.isPublished } : d))
      );
      setActionSuccess(`"${dest.name}" is now ${nextState ? 'published' : 'hidden from catalogue'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to toggle publish status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-teal-400" />
            <span>Destinations Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, curate, and configure travel destinations across regions with geographic coordinates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDestinations(page, searchQuery)}
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
            <span>Add Destination</span>
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

      {/* Search Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by destination name, state, or country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </form>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{destinations.length}</span> of{' '}
          <span className="text-white font-semibold">{totalElements}</span> destinations
        </div>
      </div>

      {/* Destinations Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Destination</th>
                <th className="py-3.5 px-4 sm:px-6">Location</th>
                <th className="py-3.5 px-4 sm:px-6">Category</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading destinations...</span>
                  </td>
                </tr>
              ) : destinations.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No destinations found. Click "Add Destination" to register one.
                  </td>
                </tr>
              ) : (
                destinations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={d.imageUrl || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&auto=format&fit=crop'}
                          alt={d.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=100&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <div className="font-bold text-white">{d.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {d.description || 'No description provided'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-medium">{d.state}</div>
                      <div className="text-xs text-slate-400">{d.country}</div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-teal-400 border border-slate-700">
                        {d.category?.replace('_', ' ') || 'GENERAL'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          d.isPublished !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            d.isPublished !== false ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        ></span>
                        {d.isPublished !== false ? 'Published' : 'Hidden'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(d)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          title="Edit Destination"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(d)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            d.isPublished !== false
                              ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                          }`}
                          title={d.isPublished !== false ? 'Hide from Catalogue' : 'Publish to Catalogue'}
                        >
                          {d.isPublished !== false ? (
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

      {/* Destination Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-teal-400" />
                <span>{modalMode === 'create' ? 'Create New Destination' : 'Edit Destination'}</span>
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
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Destination Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. Manali, Himachal Pradesh"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    State / Region <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    placeholder="e.g. Himachal Pradesh"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Country <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Best Time To Visit</label>
                  <input
                    type="text"
                    name="bestTimeToVisit"
                    value={formData.bestTimeToVisit}
                    onChange={handleFormChange}
                    placeholder="e.g. October to March"
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

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude (Decimal)</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleFormChange}
                    placeholder="e.g. 32.2396"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude (Decimal)</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleFormChange}
                    placeholder="e.g. 77.1887"
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
                    placeholder="Provide a compelling overview of this destination..."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isPublished"
                    name="isPublished"
                    checked={formData.isPublished}
                    onChange={handleFormChange}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="isPublished" className="text-slate-300 font-medium cursor-pointer">
                    Publish immediately to the customer discovery catalogue
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
                  <span>{modalMode === 'create' ? 'Create Destination' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDestinations;
