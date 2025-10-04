
import React from 'react';
import { BellIcon, MenuIcon } from './icons';
import { AppView } from '../types';
import TopNav from './TopNav';
import UserProfileWidget from './UserProfileWidget';

interface TopBarProps {
  onMenuClick: () => void;
  children: React.ReactNode;
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick, children, activeView, setActiveView }) => {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/50 px-4 sm:px-6 shadow-md">
      {/* Left Side */}
      <div className="flex flex-1 items-center justify-start">
        <button 
          onClick={onMenuClick} 
          className="p-2 mr-2 text-gray-400 rounded-full hover:bg-white/10 hover:text-white md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
      </div>
      
      {/* Centered Navigation */}
      <div className="hidden md:flex justify-center">
        <TopNav activeView={activeView} setActiveView={setActiveView} />
      </div>

      {/* Right Side */}
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <div className="w-full max-w-xs xl:max-w-sm">
          {children} {/* SearchBar */}
        </div>
        <button className="relative p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10">
          <BellIcon className="h-6 w-6" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-slate-800"></span>
        </button>
        <UserProfileWidget setActiveView={setActiveView} />
      </div>
    </header>
  );
};

export default TopBar;
