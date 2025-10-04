import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import LoadingSkeleton from '../LoadingSkeleton';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  employee_id: string;
  department: string;
  role: string;
  role_display: string;
  is_active: boolean;
  is_approved: boolean;
  date_joined: string;
  last_login: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  approved_users: number;
  pending_approval: number;
  by_role: {
    investigators: number;
    supervisors: number;
    administrators: number;
    guests: number;
  };
}

const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'inactive'>('all');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);

  useEffect(() => {
    loadUsers();
    loadStats();
  }, [filter, selectedRole]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      
      if (filter === 'pending') {
        params.is_approved = 'false';
        params.is_active = 'true';
      } else if (filter === 'approved') {
        params.is_approved = 'true';
      } else if (filter === 'inactive') {
        params.is_active = 'false';
      }

      if (selectedRole) {
        params.role = selectedRole;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await authApi.listUsers(queryString ? `?${queryString}` : '');
      
      // Handle both paginated (DRF default) and non-paginated responses
      if (Array.isArray(response)) {
        setUsers(response);
      } else if (response && Array.isArray(response.results)) {
        setUsers(response.results);
      } else {
        setUsers([]);
      }
    } catch (error: any) {
      showError(error.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await authApi.getUserStats();
      setStats(response);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleApprove = async (userId: number) => {
    setActionLoading(userId);
    try {
      await authApi.approveUser(userId);
      success('User approved successfully');
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to approve user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId: number) => {
    // Prevent admin from rejecting themselves
    if (currentUser && userId === currentUser.id) {
      showError('You cannot reject your own account!');
      return;
    }

    if (!confirm('Are you sure you want to reject this user? They will lose access to the system.')) {
      return;
    }

    setActionLoading(userId);
    try {
      await authApi.rejectUser(userId);
      success('User rejected successfully');
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to reject user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (userId: number, newRole: string) => {
    // Warn if changing own role
    if (currentUser && userId === currentUser.id) {
      if (!confirm('Warning: You are changing your own role. This may affect your permissions. Continue?')) {
        loadUsers(); // Reload to reset the dropdown
        return;
      }
    }

    setActionLoading(userId);
    try {
      await authApi.changeUserRole(userId, newRole);
      success('User role changed successfully');
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to change user role');
    } finally {
      setActionLoading(null);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelectUser = (userId: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Bulk operations
  const handleBulkApprove = async () => {
    if (selectedUsers.size === 0) return;
    setBulkActionLoading(true);
    try {
      await authApi.bulkApproveUsers(Array.from(selectedUsers));
      success(`Successfully approved ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to approve users');
    } finally {
      setBulkActionLoading(false);
      setShowBulkMenu(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.size === 0) return;

    // Check if current user is in selection
    if (currentUser && selectedUsers.has(currentUser.id)) {
      showError('You cannot reject your own account! Please deselect yourself first.');
      return;
    }

    if (!confirm(`Are you sure you want to reject ${selectedUsers.size} users?`)) return;
    setBulkActionLoading(true);
    try {
      await authApi.bulkRejectUsers(Array.from(selectedUsers));
      success(`Successfully rejected ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to reject users');
    } finally {
      setBulkActionLoading(false);
      setShowBulkMenu(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;

    // Check if current user is in selection
    if (currentUser && selectedUsers.has(currentUser.id)) {
      showError('You cannot delete your own account! Please deselect yourself first.');
      return;
    }

    if (!confirm(`Are you sure you want to DELETE ${selectedUsers.size} users? This action cannot be undone.`)) return;
    setBulkActionLoading(true);
    try {
      await authApi.bulkDeleteUsers(Array.from(selectedUsers));
      success(`Successfully deleted ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to delete users');
    } finally {
      setBulkActionLoading(false);
      setShowBulkMenu(false);
    }
  };

  const handleBulkChangeRole = async (role: string) => {
    if (selectedUsers.size === 0) return;
    setBulkActionLoading(true);
    try {
      await authApi.bulkChangeRole(Array.from(selectedUsers), role);
      success(`Successfully changed role for ${selectedUsers.size} users`);
      setSelectedUsers(new Set());
      loadUsers();
      loadStats();
    } catch (error: any) {
      showError(error.message || 'Failed to change roles');
    } finally {
      setBulkActionLoading(false);
      setShowBulkMenu(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.employee_id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'INVESTIGATOR': return 'bg-blue-500/20 text-blue-300';
      case 'SUPERVISOR': return 'bg-purple-500/20 text-purple-300';
      case 'ADMINISTRATOR': return 'bg-red-500/20 text-red-300';
      case 'GUEST': return 'bg-gray-500/20 text-gray-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  if (currentUser?.role !== 'ADMINISTRATOR') {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-red-300">You don't have permission to access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-slate-300">Manage user accounts, roles, and permissions</p>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} height={100} />
          ))}
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-slate-400 text-sm mb-1">Total Users</div>
            <div className="text-2xl font-bold text-white">{stats.total_users}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-slate-400 text-sm mb-1">Active Users</div>
            <div className="text-2xl font-bold text-green-400">{stats.active_users}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-slate-400 text-sm mb-1">Approved</div>
            <div className="text-2xl font-bold text-blue-400">{stats.approved_users}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-slate-400 text-sm mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.pending_approval}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
            <div className="text-slate-400 text-sm mb-1">Investigators</div>
            <div className="text-2xl font-bold text-purple-400">{stats.by_role.investigators}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="all" className="bg-slate-800 text-white py-2">All Users</option>
            <option value="pending" className="bg-slate-800 text-white py-2">Pending Approval</option>
            <option value="approved" className="bg-slate-800 text-white py-2">Approved</option>
            <option value="inactive" className="bg-slate-800 text-white py-2">Inactive</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            style={{ colorScheme: 'dark' }}
          >
            <option value="" className="bg-slate-800 text-white py-2">All Roles</option>
            <option value="INVESTIGATOR" className="bg-slate-800 text-white py-2">Investigator</option>
            <option value="SUPERVISOR" className="bg-slate-800 text-white py-2">Supervisor</option>
            <option value="ADMINISTRATOR" className="bg-slate-800 text-white py-2">Administrator</option>
            <option value="GUEST" className="bg-slate-800 text-white py-2">Guest</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-500/20 backdrop-blur-md rounded-lg p-4 border border-blue-500/30 mb-6">
          <div className="flex items-center justify-between">
            <div className="text-white font-semibold">
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </div>
            <div className="flex gap-2 relative">
              <button
                onClick={handleBulkApprove}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Approve All
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Reject All
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowBulkMenu(!showBulkMenu)}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Change Role ▼
                </button>
                {showBulkMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-white/20 z-10">
                <button onClick={() => handleBulkChangeRole('INVESTIGATOR')} className="block w-full text-left px-4 py-2 text-white hover:bg-white/10">
                  Investigator
                </button>
                <button onClick={() => handleBulkChangeRole('SUPERVISOR')} className="block w-full text-left px-4 py-2 text-white hover:bg-white/10">
                  Supervisor
                </button>
                <button onClick={() => handleBulkChangeRole('ADMINISTRATOR')} className="block w-full text-left px-4 py-2 text-white hover:bg-white/10">
                  Administrator
                </button>
                <button onClick={() => handleBulkChangeRole('GUEST')} className="block w-full text-left px-4 py-2 text-white hover:bg-white/10">
                  Guest
                </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
              >
                Delete All
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} height={80} />
          ))}
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">User</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Employee ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Joined</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.has(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="w-4 h-4 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                            {user.first_name[0]}{user.last_name[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-slate-400">{user.email}</div>
                            <div className="text-xs text-slate-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-white">{user.employee_id}</td>
                      <td className="px-6 py-4 text-white">{user.department}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                          {user.role_display}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {user.is_approved ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                              ✓ Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs font-semibold">
                              ⏳ Pending
                            </span>
                          )}
                          {user.is_active ? (
                            <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded text-xs font-semibold">
                              ● Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-500/20 text-gray-300 rounded text-xs font-semibold">
                              ○ Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {!user.is_approved && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleApprove(user.id)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                          )}
                          {user.is_approved && user.id !== currentUser?.id && (
                            <button
                              onClick={() => handleReject(user.id)}
                              disabled={actionLoading === user.id}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                          {user.id === currentUser?.id && (
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                              You
                            </span>
                          )}
                          <select
                            value={user.role}
                            onChange={(e) => handleChangeRole(user.id, e.target.value)}
                            disabled={actionLoading === user.id}
                            className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
                            style={{ colorScheme: 'dark' }}
                          >
                            <option value="INVESTIGATOR" className="bg-slate-800 text-white">Investigator</option>
                            <option value="SUPERVISOR" className="bg-slate-800 text-white">Supervisor</option>
                            <option value="ADMINISTRATOR" className="bg-slate-800 text-white">Administrator</option>
                            <option value="GUEST" className="bg-slate-800 text-white">Guest</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
