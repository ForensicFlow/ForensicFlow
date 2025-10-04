import React, { useState, useRef } from 'react';
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

interface AppShellProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  onGoHome: () => void;
}

const AppShell: React.FC<AppShellProps> = ({ activeView, setActiveView, onGoHome }) => {
  const [selectedSnippet, setSelectedSnippet] = useState<EvidenceSnippet | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false); // For mobile overlay
  const [isNavCollapsed, setIsNavCollapsed] = useState(false); // For desktop collapse
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activeCaseTab, setActiveCaseTab] = useState<CaseTabView>(CaseTabView.EVIDENCE);
  const searchInputRef = useRef<HTMLInputElement>(null);


  const handleCaseSelect = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActiveCaseTab(CaseTabView.EVIDENCE); // Reset to evidence tab
    setActiveView(AppView.CASE_DETAIL);
  };

  const handleBackFromCase = () => {
    setSelectedCaseId(null);
    setActiveView(AppView.CASES);
  };

  // Navigation keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'c',
      handler: () => {
        setActiveView(AppView.CASES);
        setSelectedCaseId(null);
      },
      description: 'Go to Cases view',
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

  const renderActiveView = () => {
    switch (activeView) {
      case AppView.SEARCH:
        return <SearchView 
                  onSnippetSelect={setSelectedSnippet} 
                  selectedSnippet={selectedSnippet} 
                  searchQuery={searchQuery}
                />;
      case AppView.CASES:
        return <CaseView onCaseSelect={handleCaseSelect} />;
      case AppView.CASE_DETAIL:
        return selectedCaseId ? (
          <CaseDetailView 
            caseId={selectedCaseId} 
            onBack={handleBackFromCase}
            activeTab={activeCaseTab}
          />
        ) : (
          <CaseView onCaseSelect={handleCaseSelect} />
        );
      case AppView.SETTINGS:
        return <SettingsView />;
      case AppView.USER_MANAGEMENT:
        return <UserManagementView />;
      default:
        return <SearchView 
                  onSnippetSelect={setSelectedSnippet} 
                  selectedSnippet={selectedSnippet}
                  searchQuery={searchQuery} 
                />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-900/50 relative overflow-hidden">
      {/* Mobile Nav Overlay/Backdrop */}
      <div 
        onClick={() => setIsNavOpen(false)} 
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity ${
          isNavOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      ></div>

      <LeftNav 
        activeView={activeView} 
        setActiveView={(view) => {
            setActiveView(view);
            setIsNavOpen(false); // Close mobile nav on selection
        }}
        isNavOpen={isNavOpen}
        isCollapsed={isNavCollapsed}
        setIsCollapsed={setIsNavCollapsed}
        onGoHome={onGoHome}
        activeCaseTab={activeCaseTab}
        setActiveCaseTab={setActiveCaseTab}
        selectedCaseId={selectedCaseId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar 
          onMenuClick={() => setIsNavOpen(true)}
          activeView={activeView}
          setActiveView={setActiveView}
        >
          <SearchBar 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            ref={searchInputRef}
          />
        </TopBar>
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default AppShell;
