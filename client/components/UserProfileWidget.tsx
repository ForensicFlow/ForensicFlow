
import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon } from './icons';
import { AppView } from '../types';
import UserProfileDropdown from './UserProfileDropdown';

interface UserProfileWidgetProps {
  setActiveView: (view: AppView) => void;
}

const UserProfileWidget: React.FC<UserProfileWidgetProps> = ({ setActiveView }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={profileRef}>
        <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-2 p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <UserCircleIcon className="h-8 w-8" />
        </button>
        <UserProfileDropdown 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)}
          onNavigateToSettings={() => {
            setActiveView(AppView.SETTINGS);
            setIsProfileOpen(false);
          }}
        />
    </div>
  );
};

export default UserProfileWidget;
