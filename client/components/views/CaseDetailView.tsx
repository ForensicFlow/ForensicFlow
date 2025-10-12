import React, { useState, useEffect, useCallback } from 'react';
import { casesApi } from '@/lib/api.ts';
import FileUploadModal from '../FileUploadModal';
import CaseStatusManager from '../CaseStatusManager';
import { EvidenceSnippet, CaseTabView } from '../../types';
import ResultCard from '../ResultCard';
import TimelineView from './TimelineView';
import NetworkGraphView from './NetworkGraphView';
import ReportsView from './ReportsView';
import AuditLogView from './AuditLogView';
import SpectraX from '../SpectraX';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useToast } from '@/contexts/ToastContext.tsx';
import { useDemo } from '@/contexts/DemoContext.tsx';

interface CaseDetailViewProps {
  caseId: string;
  onBack: () => void;
  activeTab: CaseTabView;
  onTabChange?: (tab: CaseTabView) => void;
}

// Helper function to safely display numbers
const safeNumber = (value: any, fallback: number = 0): number => {
  const num = typeof value === 'number' ? value : parseInt(value);
  return isNaN(num) ? fallback : num;
};

const CaseDetailView: React.FC<CaseDetailViewProps> = ({ caseId, onBack, activeTab, onTabChange }) => {
  const [caseData, setCaseData] = useState<any>(null);
  const [evidence, setEvidence] = useState<EvidenceSnippet[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState<EvidenceSnippet | null>(null);
  const [showEvidenceSidebar, setShowEvidenceSidebar] = useState(true);
  const [hypothesisModeActive, setHypothesisModeActive] = useState(false);
  const { info } = useToast();
  const { isDemoMode, getSampleCase, getSampleCaseEvidence} = useDemo();

  const loadCaseData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (isDemoMode) {
        // Use sample data in demo mode
        const sampleCase = getSampleCase(caseId);
        const sampleEvidence = getSampleCaseEvidence(caseId);
        
        if (sampleCase) {
          setCaseData(sampleCase);
          setEvidence(sampleEvidence);
        } else {
          console.error('Sample case not found:', caseId);
        }
      } else {
        // Fetch real data from API
        const [caseInfo, evidenceData] = await Promise.all([
          casesApi.get(caseId),
          casesApi.getEvidence(caseId),
        ]);
        setCaseData(caseInfo);
        setEvidence(evidenceData);
      }
    } catch (error) {
      console.error('Error loading case:', error);
    } finally {
      setLoading(false);
    }
  }, [caseId, isDemoMode, getSampleCase, getSampleCaseEvidence]);

  useEffect(() => {
    loadCaseData();
  }, [loadCaseData]);

  const handleUploadComplete = () => {
    loadCaseData(); // Reload case data after upload
  };

  const handleStatusChange = (newStatus: 'Active' | 'Closed' | 'Archived') => {
    // Update local case data
    setCaseData((prev: any) => ({ ...prev, status: newStatus }));
  };

  const handleCaseDeleted = () => {
    // Go back to cases list
    onBack();
  };

  // Case detail keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'e',
      handler: () => {
        // Export functionality (placeholder for now)
        info('Export feature coming soon');
      },
      description: 'Export report',
    },
    {
      key: 'Escape',
      handler: () => {
        // Close upload modal if open, otherwise go back
        if (uploadModalOpen) {
          setUploadModalOpen(false);
        } else {
          onBack();
        }
      },
      description: 'Go back to cases list',
    },
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Loading case...</div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white">Case not found</div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case CaseTabView.EVIDENCE:
        return (
          <div>
            {/* Case Description */}
            {caseData.description && (
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Description</h3>
                <p className="text-slate-400">{caseData.description}</p>
              </div>
            )}

            {/* Investigators */}
            {caseData.investigators && caseData.investigators.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Investigators</h3>
                <div className="flex flex-wrap gap-2">
                  {caseData.investigators.map((inv: any, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-slate-700 rounded-full text-sm text-slate-300">
                      {inv.first_name} {inv.last_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {caseData.files && caseData.files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Uploaded Files</h3>
                <div className="space-y-2">
                  {caseData.files.map((file: any) => (
                    <div key={file.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{file.original_filename}</p>
                        <p className="text-sm text-slate-400">
                          {file.file_type} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        {file.processed ? (
                          <span className="text-green-400 text-sm">✓ Processed</span>
                        ) : (
                          <span className="text-yellow-400 text-sm">Processing...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Evidence ({evidence.length})</h3>
              {evidence.length > 0 ? (
                <div className="space-y-4">
                  {evidence.map((snippet) => (
                    <ResultCard
                      key={snippet.id}
                      snippet={snippet}
                      isSelected={selectedSnippet?.id === snippet.id}
                      onSelect={() => setSelectedSnippet(snippet)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-slate-400 rounded-lg border border-dashed border-slate-700">
                  <p className="font-semibold">No evidence yet.</p>
                  <p className="text-sm mt-1">Upload a UFDR file to start analyzing evidence.</p>
                </div>
              )}
            </div>
          </div>
        );

      case CaseTabView.FLOWBOT:
        return (
          <div className={`flex gap-4 transition-all duration-500 ${
            hypothesisModeActive 
              ? 'h-screen fixed inset-0 z-50 bg-slate-900' 
              : 'h-[calc(100vh-280px)] min-h-[500px]'
          }`}>
            {/* Left Panel - Evidence Sidebar */}
            {showEvidenceSidebar && (
              <div className={`flex-shrink-0 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden flex flex-col h-full transition-all duration-500 ${
                hypothesisModeActive 
                  ? 'w-16 animate-slideOut' 
                  : 'w-80 animate-slideIn'
              }`} aria-label="Evidence Panel">
                <div className={`border-b border-slate-700 bg-slate-800/50 flex items-center flex-shrink-0 transition-all duration-300 ${
                  hypothesisModeActive ? 'p-2 justify-center' : 'p-4 justify-between'
                }`}>
                  {!hypothesisModeActive ? (
                    <>
                      <div>
                        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                          <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Evidence ({evidence.length})
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Reference while chatting</p>
                      </div>
                      <button
                        onClick={() => setShowEvidenceSidebar(false)}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                        title="Hide evidence panel"
                        aria-label="Hide evidence panel"
                      >
                        <svg className="h-4 w-4 text-slate-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-bold text-cyan-400 mt-1">{evidence.length}</span>
                    </div>
                  )}
                </div>
              
              <div className={`flex-1 overflow-y-auto space-y-2 custom-scrollbar transition-all duration-300 ${
                hypothesisModeActive ? 'p-1 opacity-0 hidden' : 'p-3 opacity-100'
              }`}>
                {!hypothesisModeActive && evidence.length > 0 ? (
                  evidence.map((snippet) => (
                    <div
                      key={snippet.id}
                      onClick={() => setSelectedSnippet(snippet)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedSnippet?.id === snippet.id
                          ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-800/50 border-slate-700 hover:border-cyan-500/30 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={`p-1 rounded ${
                          snippet.type === 'message' ? 'bg-blue-500/20' :
                          snippet.type === 'file' ? 'bg-purple-500/20' :
                          'bg-green-500/20'
                        }`}>
                          <svg className={`h-3 w-3 ${
                            snippet.type === 'message' ? 'text-blue-400' :
                            snippet.type === 'file' ? 'text-purple-400' :
                            'text-green-400'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{snippet.source}</p>
                          <p className="text-xs text-slate-500">{snippet.device}</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 mb-2">{snippet.content}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500">
                          {new Date(snippet.timestamp).toLocaleDateString()}
                        </span>
                        {snippet.entities.length > 0 && (
                          <span className="px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs">
                            {snippet.entities.length} entities
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="h-12 w-12 mx-auto mb-2 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs">No evidence yet</p>
                  </div>
                )}
              </div>
              </div>
            )}

            {/* Right Panel - FlowBot */}
            <div className="flex-1 bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden h-full flex flex-col">
              {!showEvidenceSidebar && (
                <div className="flex-shrink-0 border-b border-slate-700 p-3 bg-slate-800/30">
                  <button
                    onClick={() => setShowEvidenceSidebar(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm font-medium text-white transition-all shadow-lg"
                    title="Show evidence panel"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>Show Evidence ({evidence.length})</span>
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-hidden">
          <SpectraX 
            caseId={caseId}
                onShowTimeline={() => {
                  console.log('SpectraX: Switching to Timeline tab');
                  onTabChange?.(CaseTabView.TIMELINE);
                }}
                onShowNetwork={() => {
                  console.log('SpectraX: Switching to Network tab');
                  onTabChange?.(CaseTabView.NETWORK);
                }}
                onShowEvidence={(evidenceList) => {
                  console.log('SpectraX: Switching to Evidence tab');
                  onTabChange?.(CaseTabView.EVIDENCE);
                  // If specific evidence provided, select first one
                  if (evidenceList && evidenceList.length > 0) {
                    setSelectedSnippet(evidenceList[0]);
                  }
                }}
            onHighlightEvidence={(evidenceId) => {
              console.log('SpectraX: Highlighting evidence:', evidenceId);
              const evidenceItem = evidence.find(e => e.id === evidenceId || e.id === `EV${evidenceId}`);
              if (evidenceItem) {
                setSelectedSnippet(evidenceItem);
                // Switch to evidence tab first
                onTabChange?.(CaseTabView.EVIDENCE);
                // Then scroll to element after a short delay
                setTimeout(() => {
                  const element = document.getElementById(`evidence-${evidenceId}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }, 300);
              }
            }}
                  onHypothesisModeChange={(isActive) => {
                    setHypothesisModeActive(isActive);
                  }}
          />
              </div>
            </div>
          </div>
        );

      case CaseTabView.TIMELINE:
        return <TimelineView caseId={caseId} onSnippetSelect={setSelectedSnippet} />;

      case CaseTabView.NETWORK:
        return <NetworkGraphView caseId={caseId} />;

      case CaseTabView.REPORTS:
        return <ReportsView caseId={caseId} />;

      case CaseTabView.AUDIT:
        return <AuditLogView caseId={caseId} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" role="main" aria-label="Case Detail View">
      {/* Compact Header */}
      <div className={`flex-1 overflow-y-auto transition-all duration-500 ${
        hypothesisModeActive && activeTab === CaseTabView.FLOWBOT 
          ? 'hidden' 
          : ''
      }`}>
        <div className="p-6 lg:p-8">
          {/* Breadcrumb */}
          <div className="mb-3">
        <button
          onClick={onBack}
              className="text-cyan-500 hover:text-cyan-400 flex items-center gap-2 group"
        >
              <svg className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
              <span className="text-sm">Back to Cases</span>
        </button>
          </div>

          {/* Compact Header */}
          <div className="mb-4">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-4">
              <div className="flex-1">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white mb-1">{caseData.name}</h1>
                    <p className="text-sm text-slate-400">
                      Case #{caseData.case_number || caseData.id?.slice(0, 8) || 'N/A'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                    caseData.status === 'Active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    caseData.status === 'Closed' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              }`}>
                {caseData.status || 'Active'}
              </span>
                </div>

                {/* Compact Metadata badges */}
                <div className="flex flex-wrap gap-2">
                  {caseData.priority && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded border ${
                      caseData.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                      caseData.priority === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                      caseData.priority === 'MEDIUM' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      'bg-slate-500/20 text-slate-400 border-slate-500/30'
                    }`}>
                      {caseData.priority}
                    </span>
                  )}
                  {caseData.category && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      {caseData.category}
                    </span>
                  )}
                  {caseData.created_at && (
                    <span className="px-2 py-0.5 text-xs font-medium rounded bg-slate-700/50 text-slate-300 border border-slate-600">
                      Created {new Date(caseData.created_at).toLocaleDateString()}
              </span>
                  )}
            </div>
          </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                {!isDemoMode && (
                  <CaseStatusManager
                    caseId={caseId}
                    currentStatus={caseData.status || 'Active'}
                    caseName={caseData.name}
                    onStatusChange={handleStatusChange}
                    onCaseDeleted={handleCaseDeleted}
                  />
                )}
          <button
            onClick={() => setUploadModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20"
          >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload UFDR
          </button>
        </div>
      </div>

            {/* Compact Stats Overview with safe number rendering */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
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
                      {safeNumber(caseData.evidence_count, evidence.length)}
                    </p>
                  </div>
                </div>
              </div>

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
                      {safeNumber(caseData.files?.length, 0)}
                    </p>
                  </div>
                </div>
              </div>

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
                      {safeNumber(caseData.investigators?.length, 0)}
                    </p>
                  </div>
                </div>
              </div>

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
        </div>
      </div>

          {/* Tab Content */}
          <div>
        {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Fullscreen Hypothesis Mode View */}
      {hypothesisModeActive && activeTab === CaseTabView.FLOWBOT && (
        <div className="fixed inset-0 z-50 bg-slate-900 animate-fadeIn" role="dialog" aria-modal="true" aria-label="Hypothesis Mode Fullscreen">
          {renderTabContent()}
        </div>
      )}

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        caseId={caseId}
        onUploadComplete={handleUploadComplete}
      />
    </div>
  );
};

export default CaseDetailView;

