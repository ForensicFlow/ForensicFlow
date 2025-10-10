import React, { useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import LeftNav from './LeftNav';
import TopBar from './TopBar';
import SearchView from './views/SearchView';
import CaseView from './views/CaseView';
import CaseDetailView from './views/CaseDetailView';
import SettingsView from './views/SettingsView';
import UserManagementView from './views/UserManagementView';
import { AppView, EvidenceSnippet, CaseTabView } from '../types';
import SearchBar from './SearchBar';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

// Map URL paths to AppView enum
const pathToView: Record<string, AppView> = {
  '/app/search': AppView.SEARCH,
  '/app/cases': AppView.CASES,
  '/app/settings': AppView.SETTINGS,
  '/app/users': AppView.USER_MANAGEMENT,
};

// Map AppView enum to URL paths
const viewToPath: Record<AppView, string> = {
  [AppView.SEARCH]: '/app/search',
  [AppView.CASES]: '/app/cases',
  [AppView.CASE_DETAIL]: '/app/cases', // Case detail is handled separately
  [AppView.SETTINGS]: '/app/settings',
  [AppView.USER_MANAGEMENT]: '/app/users',
};

const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [selectedSnippet, setSelectedSnippet] = useState<EvidenceSnippet | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false); // For mobile overlay
  const [isNavCollapsed, setIsNavCollapsed] = useState(false); // For desktop collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState<CaseTabView>(CaseTabView.EVIDENCE);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Determine active view from current path
  const activeView = useMemo(() => {
    const path = location.pathname;
    
    // Check for case detail view
    if (path.includes('/app/cases/') && selectedCaseId) {
      return AppView.CASE_DETAIL;
    }
    
    return pathToView[path] || AppView.SEARCH;
  }, [location.pathname, selectedCaseId]);

  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveCaseTab(CaseTabView.EVIDENCE); // Reset to evidence tab
    navigate(`/app/cases/${caseId}`);
  };

  const handleBackFromCase = () => {
    setSelectedCaseId(null);
    navigate('/app/cases');
  };

  const handleViewChange = (view: AppView) => {
    const path = viewToPath[view];
    if (path) {
      navigate(path);
      setSelectedCaseId(null); // Clear case selection when changing views
    }
  };

  // Navigation keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'c',
      handler: () => {
        navigate('/app/cases');
        setSelectedCaseId(null);
      },
      description: 'Go to Cases view',
    },
    {
      key: 's',
      handler: () => {
        navigate('/app/search');
      },
      description: 'Go to Search view',
    },
    {
      key: 'k',
      ctrl: true,
      handler: () => {
        // Focus the search bar
        searchInputRef.current?.focus();
      },
      description: 'Focus search bar',
    },
    {
      key: 'Escape',
      handler: () => {
        // Close mobile nav if open
        if (isNavOpen) {
          setIsNavOpen(false);
        }
      },
      description: 'Close navigation',
    },
  ]);

  const handleGoHome = () => {
    navigate('/app');
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-900 text-gray-200">
      {/* Top bar with integrated search */}
      <TopBar 
        onMenuClick={() => setIsNavOpen(!isNavOpen)}
        activeView={activeView}
        setActiveView={handleViewChange}
      >
        <SearchBar 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)}
          ref={searchInputRef}
        />
      </TopBar>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <LeftNav 
          activeView={activeView} 
          setActiveView={handleViewChange}
          isNavOpen={isNavOpen}
          isCollapsed={isNavCollapsed}
          setIsCollapsed={setIsNavCollapsed}
          onGoHome={handleGoHome}
          activeCaseTab={activeCaseTab}
          setActiveCaseTab={setActiveCaseTab}
          selectedCaseId={selectedCaseId}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto">
          <Routes>
            {/* Default route */}
            <Route index element={<Navigate to="/app/search" replace />} />
            
            {/* Search view */}
            <Route path="search" element={
              <SearchView 
                onSnippetSelect={setSelectedSnippet} 
                selectedSnippet={selectedSnippet} 
                searchQuery={searchQuery}
              />
            } />
            
            {/* Cases list view */}
            <Route path="cases" element={
              <CaseView onCaseSelect={handleCaseSelect} />
            } />
            
            {/* Case detail view */}
            <Route path="cases/:caseId" element={
              selectedCaseId ? (
                <CaseDetailView 
                  caseId={selectedCaseId}
                  onBack={handleBackFromCase}
                  activeTab={activeCaseTab}
                />
              ) : (
                <Navigate to="/app/cases" replace />
              )
            } />
            
            {/* Settings view */}
            <Route path="settings" element={<SettingsView />} />
            
            {/* User management view */}
            <Route path="users" element={<UserManagementView />} />
            
            {/* Catch all - redirect to search */}
            <Route path="*" element={<Navigate to="/app/search" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
