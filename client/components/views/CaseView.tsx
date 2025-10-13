
import React, { useState, useEffect, useMemo } from 'react';
import { casesApi } from '@/lib/api.ts';
import { Case } from '../../types';
import CaseCard from '../CaseCard';
import CreateCaseModal from '../CreateCaseModal';
import LockedFeatureBanner from '../LockedFeatureBanner';
import { PlusIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext.tsx';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

// Helper function to safely convert values to numbers
const safeNumber = (value: any, fallback: number = 0): number => {
    const num = typeof value === 'number' ? value : parseInt(value);
    return isNaN(num) ? fallback : num;
};

interface CaseViewProps {
    onCaseSelect?: (caseId: string) => void;
}

type SortOption = 'newest' | 'oldest' | 'name' | 'evidence';
type FilterStatus = 'all' | 'Active' | 'Archived' | 'Closed';

const CaseView: React.FC<CaseViewProps> = ({ onCaseSelect }) => {
    const { isDemoMode, getSampleData } = useDemo();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showLockedModal, setShowLockedModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

    const loadCases = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (isDemoMode) {
                // Use sample data in demo mode
                const sampleData = getSampleData();
                setCases(sampleData.cases);
            } else {
                // Fetch real data
                const data = await casesApi.list();
                setCases(data);
            }
        } catch (error) {
            console.error('Error loading cases:', error);
            setError('Failed to load cases. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCases();
    }, [isDemoMode, getSampleData]);

    // Filter and sort cases
    const filteredAndSortedCases = useMemo(() => {
        let result = [...cases];

        // Apply search filter
        if (searchQuery) {
            result = result.filter(c => 
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            result = result.filter(c => c.status === filterStatus);
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.lastModified || b.last_modified || b.updated_at || b.created_at || 0).getTime() - new Date(a.lastModified || a.last_modified || a.updated_at || a.created_at || 0).getTime();
                case 'oldest':
                    return new Date(a.lastModified || a.last_modified || a.updated_at || a.created_at || 0).getTime() - new Date(b.lastModified || b.last_modified || b.updated_at || b.created_at || 0).getTime();
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'evidence':
                    return safeNumber(b.evidenceCount || b.evidence_count, 0) - safeNumber(a.evidenceCount || a.evidence_count, 0);
                default:
                    return 0;
            }
        });

        return result;
    }, [cases, searchQuery, filterStatus, sortBy]);

    // Calculate stats
    const stats = useMemo(() => ({
        total: cases.length,
        active: cases.filter(c => c.status === 'Active').length,
        archived: cases.filter(c => c.status === 'Archived').length,
        closed: cases.filter(c => c.status === 'Closed').length,
        totalEvidence: cases.reduce((sum, c) => sum + safeNumber(c.evidenceCount || c.evidence_count, 0), 0),
    }), [cases]);

    // Keyboard shortcuts
    useKeyboardShortcuts([
        {
            key: 'n',
            ctrl: true,
            handler: () => {
                if (isDemoMode) {
                    setShowLockedModal(true);
                } else {
                    setIsCreateModalOpen(true);
                }
            },
            description: 'Create new case',
        },
        {
            key: '/',
            ctrl: true,
            handler: () => {
                document.getElementById('case-search-input')?.focus();
            },
            description: 'Focus search',
        },
        {
            key: 'Escape',
            handler: () => {
                // Close locked feature modal if open
                if (showLockedModal) {
                    setShowLockedModal(false);
                } else if (searchQuery) {
                    setSearchQuery('');
                }
            },
            description: 'Close modal or clear search',
        },
    ]);

    return (
        <div className="p-6 lg:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Case Dashboard</h1>
                    <p className="text-slate-400">Manage and track all your forensic investigations.</p>
                </div>
                <button 
                    onClick={() => {
                        if (isDemoMode) {
                            setShowLockedModal(true);
                        } else {
                            setIsCreateModalOpen(true);
                        }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-cyan-500 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                >
                    <PlusIcon className="h-5 w-5" />
                    <span>Create New Case</span>
                </button>
            </div>

            {/* Stats Cards */}
            {!loading && cases.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                        <p className="text-xs text-slate-400 mb-1">Total Cases</p>
                        <p className="text-2xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/20">
                        <p className="text-xs text-green-400 mb-1">Active</p>
                        <p className="text-2xl font-bold text-green-300">{stats.active}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 backdrop-blur-lg rounded-xl p-4 border border-yellow-500/20">
                        <p className="text-xs text-yellow-400 mb-1">Archived</p>
                        <p className="text-2xl font-bold text-yellow-300">{stats.archived}</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-900/20 to-slate-800/20 backdrop-blur-lg rounded-xl p-4 border border-slate-500/20">
                        <p className="text-xs text-slate-400 mb-1">Closed</p>
                        <p className="text-2xl font-bold text-slate-300">{stats.closed}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/20">
                        <p className="text-xs text-blue-400 mb-1">Total Evidence</p>
                        <p className="text-2xl font-bold text-blue-300">{stats.totalEvidence}</p>
                    </div>
                </div>
            )}

            {/* Search and Filters */}
            {!loading && cases.length > 0 && (
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <input
                            id="case-search-input"
                            type="text"
                            placeholder="Search cases by name, number, or description... (Ctrl+/)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        />
                        <svg className="absolute left-3 top-3 h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-3 text-slate-500 hover:text-white transition-colors"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer"
                    >
                        <option value="all">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Archived">Archived</option>
                        <option value="Closed">Closed</option>
                    </select>

                    {/* Sort Options */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all cursor-pointer"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name (A-Z)</option>
                        <option value="evidence">Most Evidence</option>
                    </select>
                </div>
            )}

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-lg p-4">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-white/10 p-5 bg-gradient-to-br from-white/5 to-white/0 animate-pulse">
                            <div className="h-6 bg-slate-700/50 rounded mb-3 w-3/4"></div>
                            <div className="h-4 bg-slate-700/50 rounded mb-4 w-1/2"></div>
                            <div className="h-20 bg-slate-700/50 rounded mb-4"></div>
                            <div className="h-10 bg-slate-700/50 rounded"></div>
                        </div>
                    ))}
                </div>
            ) : filteredAndSortedCases.length > 0 ? (
                <>
                    {searchQuery && (
                        <p className="text-sm text-slate-400 mb-4">
                            Found {filteredAndSortedCases.length} {filteredAndSortedCases.length === 1 ? 'case' : 'cases'}
                        </p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAndSortedCases.map(caseInfo => (
                            <CaseCard 
                                key={caseInfo.id} 
                                caseInfo={caseInfo} 
                                onClick={() => onCaseSelect && onCaseSelect(caseInfo.id)}
                            />
                        ))}
                    </div>
                </>
            ) : searchQuery || filterStatus !== 'all' ? (
                <div className="text-center py-20 text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <svg className="h-16 w-16 mx-auto mb-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <p className="font-semibold">No cases match your filters</p>
                    <p className="text-sm mt-1 mb-4">Try adjusting your search or filters</p>
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setFilterStatus('all');
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="text-center py-20 text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <PlusIcon className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                    <p className="font-semibold">No cases found.</p>
                    <p className="text-sm mt-1 mb-4">Create a new case to get started.</p>
                    <button
                        onClick={() => {
                            if (isDemoMode) {
                                setShowLockedModal(true);
                            } else {
                                setIsCreateModalOpen(true);
                            }
                        }}
                        className="inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors shadow-lg shadow-cyan-500/20"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Create First Case</span>
                    </button>
                </div>
            )}

            {/* Create Case Modal */}
            {!isDemoMode && (
                <CreateCaseModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onCaseCreated={loadCases}
                />
            )}
            
            {showLockedModal && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowLockedModal(false)}
                >
                    <div 
                        className="max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border border-cyan-500/30 p-8 shadow-2xl">
                            <div className="flex justify-center mb-4">
                                <div className="p-4 bg-cyan-500/10 rounded-full">
                                    <svg className="h-12 w-12 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-bold text-white text-center mb-3">
                                Feature Locked
                            </h3>
                            
                            <p className="text-slate-300 text-center mb-6">
                                Creating new cases is not available in demo mode. Sign up now to unlock all features and start your own investigations.
                            </p>
                            
                            <button 
                                onClick={() => setShowLockedModal(false)}
                                className="w-full px-6 py-3 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg backdrop-blur-md hover:bg-white/5 transition-all"
                            >
                                Close
                            </button>
                            
                            <p className="text-xs text-slate-400 text-center mt-4">
                                Press <kbd className="px-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs font-mono text-slate-300">Esc</kbd> or click outside to close
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CaseView;
