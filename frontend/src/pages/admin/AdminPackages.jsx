import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import {
  Luggage,
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
  Clock,
  Users,
  MapPin
} from 'lucide-react';

const PACKAGE_TIERS = ['BUDGET', 'STANDARD', 'PREMIUM', 'LUXURY'];

export const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
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
    tier: 'STANDARD',
    durationDays: 4,
    durationNights: 3,
    basePrice: '',
    discountedPrice: '',
    maxPersons: 6,
    imageUrl: '',
    inclusions: '',
    exclusions: '',
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

  const fetchPackages = async (pageToFetch = page, destFilter = selectedDestinationFilter) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getPackages({
        destinationId: destFilter ? parseInt(destFilter, 10) : undefined,
        page: pageToFetch,
        size: 10
      });
      setPackages(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
  }, []);

  useEffect(() => {
    fetchPackages(page, selectedDestinationFilter);
  }, [page, selectedDestinationFilter]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormData({
      destinationId: destinationsList[0]?.id || '',
      name: '',
      description: '',
      tier: 'STANDARD',
      durationDays: 4,
      durationNights: 3,
      basePrice: '',
      discountedPrice: '',
      maxPersons: 6,
      imageUrl: '',
      inclusions: 'Hotel Stay, Daily Breakfast, Guided Sightseeing, Airport Transfers',
      exclusions: 'Personal Expenses, Flight Tickets, Travel Insurance',
      isActive: true
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setModalMode('edit');
    setEditingId(pkg.id);
    setFormData({
      destinationId: pkg.destinationId || pkg.destination?.id || '',
      name: pkg.name || '',
      description: pkg.description || '',
      tier: pkg.tier || 'STANDARD',
      durationDays: pkg.durationDays || 4,
      durationNights: pkg.durationNights || 3,
      basePrice: pkg.basePrice ?? '',
      discountedPrice: pkg.discountedPrice ?? '',
      maxPersons: pkg.maxPersons || 6,
      imageUrl: pkg.imageUrl || '',
      inclusions: Array.isArray(pkg.inclusions)
        ? pkg.inclusions.join(', ')
        : pkg.inclusions || '',
      exclusions: Array.isArray(pkg.exclusions)
        ? pkg.exclusions.join(', ')
        : pkg.exclusions || '',
      isActive: pkg.isActive !== false
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
    if (!formData.name.trim() || !formData.destinationId || !formData.basePrice) {
      setModalError('Package Name, Destination, and Base Price are required.');
      return;
    }

    try {
      setSaving(true);
      setModalError(null);

      const inclusionsArray = formData.inclusions
        ? formData.inclusions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const exclusionsArray = formData.exclusions
        ? formData.exclusions
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const payload = {
        ...formData,
        destinationId: parseInt(formData.destinationId, 10),
        durationDays: parseInt(formData.durationDays, 10),
        durationNights: parseInt(formData.durationNights, 10),
        maxPersons: parseInt(formData.maxPersons, 10),
        basePrice: parseFloat(formData.basePrice),
        discountedPrice: formData.discountedPrice !== '' ? parseFloat(formData.discountedPrice) : null,
        inclusions: inclusionsArray,
        exclusions: exclusionsArray
      };

      if (modalMode === 'create') {
        await adminApi.createPackage(payload);
        setActionSuccess(`Holiday package "${formData.name}" created successfully.`);
      } else {
        await adminApi.updatePackage(editingId, payload);
        setActionSuccess(`Holiday package "${formData.name}" updated successfully.`);
      }

      setIsModalOpen(false);
      setTimeout(() => setActionSuccess(''), 4000);
      fetchPackages(page, selectedDestinationFilter);
    } catch (err) {
      setModalError(err.message || 'Failed to save package.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    const nextState = !pkg.isActive;
    const actionDesc = nextState ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${actionDesc} package "${pkg.name}"?`)) return;

    try {
      const updated = await adminApi.togglePackageActive(pkg.id);
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, isActive: updated.isActive } : p))
      );
      setActionSuccess(`"${pkg.name}" is now ${nextState ? 'active' : 'inactive'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to toggle package status.');
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
            <Luggage className="w-6 h-6 text-teal-400" />
            <span>Tour & Holiday Packages</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Curate holiday itineraries, pricing tiers, inclusions, exclusions, and booking availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPackages(page, selectedDestinationFilter)}
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
            <span>Add Package</span>
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
          Showing <span className="text-white font-semibold">{packages.length}</span> of{' '}
          <span className="text-white font-semibold">{totalElements}</span> packages
        </div>
      </div>

      {/* Packages Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Package Details</th>
                <th className="py-3.5 px-4 sm:px-6">Destination</th>
                <th className="py-3.5 px-4 sm:px-6">Tier & Duration</th>
                <th className="py-3.5 px-4 sm:px-6">Pricing</th>
                <th className="py-3.5 px-4 sm:px-6">Active</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading packages...</span>
                  </td>
                </tr>
              ) : packages.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500">
                    No holiday packages found. Click "Add Package" to create one.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={pkg.imageUrl || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&auto=format&fit=crop'}
                          alt={pkg.name}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-800 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=100&auto=format&fit=crop';
                          }}
                        />
                        <div>
                          <div className="font-bold text-white">{pkg.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {pkg.description || 'Curated holiday itinerary'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                        <span>{pkg.destinationName || 'Regional'}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="space-y-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            pkg.tier === 'LUXURY'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : pkg.tier === 'PREMIUM'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : pkg.tier === 'STANDARD'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {pkg.tier || 'STANDARD'}
                        </span>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {pkg.durationDays || 0}D / {pkg.durationNights || 0}N
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="text-white font-bold text-xs">
                        {formatPrice(pkg.discountedPrice || pkg.basePrice)}
                      </div>
                      {pkg.discountedPrice && (
                        <div className="text-[11px] text-slate-500 line-through">
                          {formatPrice(pkg.basePrice)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          pkg.isActive !== false
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            pkg.isActive !== false ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        ></span>
                        {pkg.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(pkg)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                          title="Edit Package"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(pkg)}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            pkg.isActive !== false
                              ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                          }`}
                          title={pkg.isActive !== false ? 'Deactivate Package' : 'Activate Package'}
                        >
                          {pkg.isActive !== false ? (
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

      {/* Package Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Luggage className="w-5 h-5 text-teal-400" />
                <span>{modalMode === 'create' ? 'Add Holiday Package' : 'Edit Holiday Package'}</span>
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
                    Package Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="e.g. 5D Spectacular Manali & Solang Valley"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Package Tier</label>
                  <select
                    name="tier"
                    value={formData.tier}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  >
                    {PACKAGE_TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Travelers</label>
                  <input
                    type="number"
                    min="1"
                    name="maxPersons"
                    value={formData.maxPersons}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration Days</label>
                  <input
                    type="number"
                    min="1"
                    name="durationDays"
                    value={formData.durationDays}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration Nights</label>
                  <input
                    type="number"
                    min="0"
                    name="durationNights"
                    value={formData.durationNights}
                    onChange={handleFormChange}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Base Price (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleFormChange}
                    placeholder="e.g. 15999"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Discounted Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountedPrice"
                    value={formData.discountedPrice}
                    onChange={handleFormChange}
                    placeholder="e.g. 12999"
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
                    Inclusions (comma separated)
                  </label>
                  <input
                    type="text"
                    name="inclusions"
                    value={formData.inclusions}
                    onChange={handleFormChange}
                    placeholder="Hotel Stay, Breakfast, Sightseeing Cab, Permit Fees"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Exclusions (comma separated)
                  </label>
                  <input
                    type="text"
                    name="exclusions"
                    value={formData.exclusions}
                    onChange={handleFormChange}
                    placeholder="Airfare, Personal Expenses, Lunch/Dinner, Tips"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Itinerary / Description</label>
                  <textarea
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Overview of the tour experience, day-by-day highlights..."
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
                    Enable package for booking in customer portal
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
                  <span>{modalMode === 'create' ? 'Create Package' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackages;
