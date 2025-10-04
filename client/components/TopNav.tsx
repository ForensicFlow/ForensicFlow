
import React from 'react';
import { AppView } from '../types';
import { NAV_ITEMS } from '../constants';
import { useDemo } from '@/contexts/DemoContext.tsx';

interface TopNavProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const TopNav: React.FC<TopNavProps> = ({ activeView, setActiveView }) => {
  const { isDemoMode } = useDemo();
  
  // Filter out Settings in demo mode, then select subset for top nav
  const filteredItems = isDemoMode 
    ? NAV_ITEMS.filter(item => item.view !== AppView.SETTINGS)
    : NAV_ITEMS;
  const topNavItems = filteredItems.slice(0, 4);
  
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1.5 backdrop-blur-lg">
      {topNavItems.map((item) => (
        <button
          key={item.label}
          onClick={() => setActiveView(item.view)}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-colors duration-200
            ${
              activeView === item.view
                ? 'bg-cyan-500/30 text-cyan-300'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          title={item.label}
          aria-label={item.label}
        >
          {React.cloneElement(item.icon, { className: 'h-5 w-5' })}
        </button>
      ))}
    </div>
  );
};

export default TopNav;
