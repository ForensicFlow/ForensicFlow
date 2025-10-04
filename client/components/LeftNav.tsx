
import React from 'react';
import { AppView, CaseTabView } from '../types';
import { NAV_ITEMS, CASE_TAB_ITEMS } from '../constants';
import { ChevronDoubleLeftIcon, ShieldExclamationIcon, UserCircleIcon } from './icons';
import { ForensicFlowLogo } from './Logo';
import { useAuth } from '@/contexts/AuthContext';
import { useDemo } from '@/contexts/DemoContext';
import { useKeyboardShortcutsHelp } from '@/contexts/KeyboardShortcutsContext';
import { getModKeyDisplay } from '../hooks/useKeyboardShortcuts';

interface LeftNavProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  isNavOpen: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onGoHome: () => void;
  activeCaseTab?: CaseTabView;
  setActiveCaseTab?: (tab: CaseTabView) => void;
  selectedCaseId?: string | null;
}

const LeftNav: React.FC<LeftNavProps> = ({ 
  activeView, 
  setActiveView, 
  isNavOpen, 
  isCollapsed, 
  setIsCollapsed, 
  onGoHome,
  activeCaseTab,
  setActiveCaseTab,
  selectedCaseId
}) => {
  const { user } = useAuth();
  const { isDemoMode } = useDemo();
  const { showHelp } = useKeyboardShortcutsHelp();
  const modKey = getModKeyDisplay();
  const isAdmin = user?.role === 'ADMINISTRATOR';
  
  // Filter out Settings in demo mode
  const visibleNavItems = isDemoMode 
    ? NAV_ITEMS.filter(item => item.view !== AppView.SETTINGS)
    : NAV_ITEMS;

  // Check if we're viewing a case detail
  const isInCaseDetail = activeView === AppView.CASE_DETAIL && selectedCaseId;

  return (
    <nav className={`
      fixed top-0 left-0 h-full z-40
      md:relative md:z-auto
      flex flex-col bg-black/20 backdrop-blur-lg border-r border-white/10 
      transition-transform md:transition-all duration-300 ease-in-out
      ${isCollapsed ? 'md:w-20' : 'md:w-64'}
      ${isNavOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
    `}>
      <div className="flex items-center justify-between h-16 border-b border-white/10 px-4">
        <button onClick={onGoHome} aria-label="Go to homepage">
          <ForensicFlowLogo isTextVisible={!isCollapsed} />
        </button>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-md hover:bg-white/10 text-gray-300 hidden md:block"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronDoubleLeftIcon className={`h-6 w-6 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        </button>
      </div>

      <ul className="flex-1 space-y-2 px-2 py-4 overflow-y-auto">
        {!isInCaseDetail ? (
          <>
            {/* Main Navigation */}
            {visibleNavItems.map((item) => (
              <li key={item.label}>
                <button
                  onClick={() => setActiveView(item.view)}
                  className={`w-full flex items-center p-3 rounded-md transition-colors duration-200 ${
                    activeView === item.view ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
            
            {/* Admin-only User Management - Hidden in demo mode */}
            {isAdmin && !isDemoMode && (
              <li>
                <button
                  onClick={() => setActiveView(AppView.USER_MANAGEMENT)}
                  className={`w-full flex items-center p-3 rounded-md transition-colors duration-200 ${
                    activeView === AppView.USER_MANAGEMENT ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? 'User Management' : ''}
                >
                  <UserCircleIcon className="h-6 w-6" />
                  {!isCollapsed && <span className="ml-4 font-medium">User Management</span>}
                </button>
              </li>
            )}
          </>
        ) : (
          <>
            {/* Case Detail Tabs */}
            {!isCollapsed && (
              <li className="px-2 pb-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Navigation</p>
              </li>
            )}
            {CASE_TAB_ITEMS.map((tab, index) => (
              <li key={tab.view}>
                <button
                  onClick={() => setActiveCaseTab && setActiveCaseTab(index as CaseTabView)}
                  className={`w-full flex items-center p-3 rounded-md transition-colors duration-200 ${
                    activeCaseTab === index ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? tab.label : ''}
                >
                  {tab.icon}
                  {!isCollapsed && <span className="ml-4 font-medium">{tab.label}</span>}
                </button>
              </li>
            ))}
            
            {/* Divider */}
            {!isCollapsed && <li className="my-2"><div className="border-t border-white/10"></div></li>}
            
            {/* Back to Cases */}
            <li>
              <button
                onClick={() => setActiveView(AppView.CASES)}
                className={`w-full flex items-center p-3 rounded-md transition-colors duration-200 text-slate-400 hover:bg-white/10 hover:text-white ${
                  isCollapsed ? 'justify-center' : ''
                }`}
                title={isCollapsed ? 'Back to Cases' : ''}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {!isCollapsed && <span className="ml-4 font-medium">Back to Cases</span>}
              </button>
            </li>
          </>
        )}
      </ul>

      <div className="p-4 border-t border-white/10 space-y-3">
        {/* Keyboard Shortcuts Hint */}
        <button
          onClick={showHelp}
          className={`w-full p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors ${isCollapsed ? 'flex justify-center' : 'flex items-center justify-between'}`}
          title={isCollapsed ? 'Keyboard shortcuts' : ''}
        >
          {!isCollapsed ? (
            <>
              <span className="text-sm">Keyboard shortcuts</span>
              <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-cyan-300">
                {modKey}+/
              </kbd>
            </>
          ) : (
            <span className="text-lg">⌨️</span>
          )}
        </button>

        {/* Demo Data Notice */}
        {isDemoMode && (
          <div className={`p-3 rounded-lg bg-yellow-500/10 text-yellow-300 ${isCollapsed ? 'flex justify-center' : 'flex items-center'}`}>
            <ShieldExclamationIcon className="h-6 w-6" />
            {!isCollapsed && <p className="ml-3 text-sm">Demo Data Active</p>}
          </div>
        )}
      </div>
    </nav>
  );
};

export default LeftNav;
