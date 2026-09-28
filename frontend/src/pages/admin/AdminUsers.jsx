import React, { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
  Mail,
  RefreshCw
} from 'lucide-react';

export const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchUsers = async (pageToFetch = page, query = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getUsers({
        search: query || undefined,
        page: pageToFetch,
        size: 10
      });
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || 0);
    } catch (err) {
      setError(err.message || 'Failed to retrieve users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page, searchTerm);
  }, [page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchUsers(0, searchTerm);
  };

  const handleStatusToggle = async (targetUser) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const confirmMessage =
      newStatus === 'SUSPENDED'
        ? `Are you sure you want to suspend user "${targetUser.username}"? They will not be able to log in.`
        : `Are you sure you want to reactivate user "${targetUser.username}"?`;

    if (!window.confirm(confirmMessage)) return;

    try {
      const userIdentifier = targetUser.id || targetUser.uuid;
      setUpdatingId(userIdentifier);
      setActionSuccess('');
      const updated = await adminApi.updateUserStatus(userIdentifier, newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          (u.id === targetUser.id || u.uuid === targetUser.uuid) ? { ...u, status: updated.status } : u
        )
      );
      setActionSuccess(`User "${targetUser.username}" is now ${newStatus}.`);
      setTimeout(() => setActionSuccess(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to update user status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-teal-400" />
            <span>User Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse registered customer and staff accounts, search credentials, and moderate account states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers(page, searchTerm)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh list"
          >
            <RefreshCw className="w-4 h-4 text-teal-400" />
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

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-96 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by username, full name, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </form>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{users.length}</span> of{' '}
          <span className="text-white font-semibold">{totalElements}</span> users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950/80 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">User Account</th>
                <th className="py-3.5 px-4 sm:px-6">Email Address</th>
                <th className="py-3.5 px-4 sm:px-6">Assigned Roles</th>
                <th className="py-3.5 px-4 sm:px-6">Status</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    <Loader2 className="w-8 h-8 text-teal-400 animate-spin mx-auto mb-2" />
                    <span>Loading users from database...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-500">
                    No users found matching the query.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.username === u.username;
                  const isSuspended = u.status === 'SUSPENDED';

                  return (
                    <tr key={u.uuid || u.username} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white text-xs">
                            {u.fullName?.charAt(0) || u.username?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.fullName || u.username}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{u.email}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex flex-wrap gap-1">
                          {u.roles?.map((role) => (
                            <span
                              key={role}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                role.includes('ADMIN')
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {role.replace('ROLE_', '')}
                            </span>
                          )) || <span className="text-slate-500">CUSTOMER</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isSuspended
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuspended ? 'bg-rose-400' : 'bg-emerald-400'
                            }`}
                          ></span>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {isSelf ? (
                          <span className="text-xs text-slate-500 italic">Self (Protected)</span>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(u)}
                            disabled={updatingId === (u.id || u.uuid)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isSuspended
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-800'
                            }`}
                          >
                            {updatingId === (u.id || u.uuid) ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : isSuspended ? (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivate</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Suspend</span>
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
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
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1 || loading}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
