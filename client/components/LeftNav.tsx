
import React from 'react';
import { AppView, CaseTabView } from '../types';
import { NAV_ITEMS, CASE_TAB_ITEMS } from '../constants';
import { ChevronDoubleLeftIcon, ShieldExclamationIcon, UserCircleIcon } from './icons';
import { ForensicFlowLogo } from './Logo';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useDemo } from '@/contexts/DemoContext.tsx';
import { useKeyboardShortcutsHelp } from '@/contexts/KeyboardShortcutsContext.tsx';
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
  caseData?: any;
  evidenceCount?: number;
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
  selectedCaseId,
  caseData,
  evidenceCount
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
            
            {/* Case Stats Section */}
            {!isCollapsed && caseData && (
              <>
                <li className="my-2"><div className="border-t border-white/10"></div></li>
                <li className="px-2 pb-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Overview</p>
                </li>
                <li className="space-y-2 px-2">
                  {/* Evidence Items */}
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 rounded-lg p-3 border border-blue-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-500/20 rounded">
                        <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-blue-400">Evidence Items</p>
                        <p className="text-xl font-bold text-white">
                          {evidenceCount !== undefined ? evidenceCount : (caseData.evidence_count || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Files Uploaded */}
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-lg p-3 border border-purple-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-500/20 rounded">
                        <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-purple-400">Files Uploaded</p>
                        <p className="text-xl font-bold text-white">
                          {caseData.files?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Investigators */}
                  <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 rounded-lg p-3 border border-green-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-500/20 rounded">
                        <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-green-400">Investigators</p>
                        <p className="text-xl font-bold text-white">
                          {caseData.investigators?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Last Updated */}
                  <div className="bg-gradient-to-br from-orange-900/20 to-orange-800/20 rounded-lg p-3 border border-orange-500/20">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-500/20 rounded">
                        <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-orange-400">Last Updated</p>
                        <p className="text-sm font-semibold text-white truncate">
                          {new Date(caseData.updated_at || caseData.last_modified || caseData.lastModified || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              </>
            )}
            
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
