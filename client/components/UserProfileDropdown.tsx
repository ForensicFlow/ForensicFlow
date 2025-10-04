import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { CogIcon, LogoutIcon } from './icons';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSettings: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ isOpen, onClose, onNavigateToSettings }) => {
  const { user, logout } = useAuth();
  const { isDemoMode } = useDemo();

  if (!isOpen || !user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Generate initials for avatar
  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || user.username.substring(0, 2).toUpperCase();

  return (
    <div
      className="absolute right-0 top-12 z-50 w-72 origin-top-right rounded-xl border border-white/10 bg-slate-800/80 shadow-2xl shadow-black/40 backdrop-blur-lg transition-all duration-300"
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="user-menu-button"
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <p className="text-xs text-blue-400 truncate mt-0.5">{user.role_display}</p>
          </div>
        </div>
        {user.department && (
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-xs text-slate-400">
              <span className="font-medium">Department:</span> {user.department}
            </p>
          </div>
        )}
      </div>
      <div className="border-t border-white/10 p-2">
        {/* Hide Settings in demo mode */}
        {!isDemoMode && (
          <button
            onClick={onNavigateToSettings}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <CogIcon className="h-5 w-5" />
            <span>Settings</span>
          </button>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogoutIcon className="h-5 w-5" />
          <span>{isDemoMode ? 'Exit Demo' : 'Logout'}</span>
        </button>
      </div>
    </div>
  );
};

export default UserProfileDropdown;


