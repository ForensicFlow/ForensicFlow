import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useToast } from '@/contexts/ToastContext.tsx';
import { authApi } from '@/lib/api.ts';
import LoadingSkeleton from '../LoadingSkeleton';

const SettingsView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    two_factor_enabled: false,
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password_confirm: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        two_factor_enabled: user.two_factor_enabled || false,
      });
      setLoading(false);
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await authApi.updateProfile(profileData);
      await refreshUser();
      success('Profile updated successfully!');
    } catch (error: any) {
      showError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      showError('New passwords do not match');
      return;
    }

    setSaving(true);

    try {
      await authApi.changePassword(
        passwordData.old_password,
        passwordData.new_password,
        passwordData.new_password_confirm
      );
      success('Password changed successfully!');
      setPasswordData({
        old_password: '',
        new_password: '',
        new_password_confirm: '',
      });
    } catch (error: any) {
      showError(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <LoadingSkeleton height={40} className="mb-2" />
          <LoadingSkeleton height={24} className="mb-8" />
          <div className="space-y-6">
            <LoadingSkeleton height={400} />
            <LoadingSkeleton height={300} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Profile Information</h2>
          
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            {/* Username (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">Username cannot be changed</p>
            </div>

            {/* Role (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
              <input
                type="text"
                value={user.role_display}
                disabled
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Department (Read-only for now) */}
            {user.department && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Department</label>
                <input
                  type="text"
                  value={user.department}
                  disabled
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
              <input
                type="text"
                value={profileData.last_name}
                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
                </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={profileData.phone_number}
                onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Two Factor Authentication */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="two_factor"
                checked={profileData.two_factor_enabled}
                onChange={(e) => setProfileData({ ...profileData, two_factor_enabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="two_factor" className="ml-2 text-sm font-medium text-slate-300">
                Enable Two-Factor Authentication
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Change Password</h2>
          
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.old_password}
                onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
    </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

        <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.new_password_confirm}
                onChange={(e) => setPasswordData({ ...passwordData, new_password_confirm: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={saving}
              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Password Requirements:</h3>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• At least 8 characters long</li>
              <li>• Mix of uppercase and lowercase letters</li>
              <li>• At least one number</li>
              <li>• At least one special character</li>
            </ul>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
          <h2 className="text-xl font-bold text-white mb-4">Account Information</h2>
          
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400">Account Status</p>
              <p className="text-white font-medium">
                {user.is_approved ? (
                  <span className="text-green-400">✓ Approved</span>
                ) : (
                  <span className="text-yellow-400">⏳ Pending Approval</span>
                )}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-400">Employee ID</p>
              <p className="text-white font-medium">{user.employee_id || 'Not set'}</p>
            </div>

    <div>
              <p className="text-sm text-slate-400">Member Since</p>
              <p className="text-white font-medium">
                {new Date(user.date_joined).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
    </div>

    <div>
              <p className="text-sm text-slate-400">Last Login</p>
              <p className="text-white font-medium">
                {user.last_login ? new Date(user.last_login).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'Never'}
              </p>
    </div>

            {user.last_login_ip && (
    <div>
                <p className="text-sm text-slate-400">Last Login IP</p>
                <p className="text-white font-medium font-mono text-sm">{user.last_login_ip}</p>
              </div>
            )}
          </div>
        </div>

        {/* Login History (for admins) */}
        {user.role === 'ADMINISTRATOR' && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-white/10">
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-left"
              >
                <span className="font-medium">View Login History</span>
                <p className="text-xs text-slate-400 mt-1">Track your recent login activity</p>
              </button>

              <button
                className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-left"
              >
                <span className="font-medium">Security Settings</span>
                <p className="text-xs text-slate-400 mt-1">Manage security preferences</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
);
};

export default SettingsView;
