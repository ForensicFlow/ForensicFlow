
import React, { useState, useEffect, useMemo } from 'react';
import { evidenceApi } from '@/lib/api.ts';
import { EvidenceSnippet } from '../../types';
import { DocumentTextIcon, PhotographIcon, TerminalIcon, ClockIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext.tsx';

interface TimelineViewProps {
  caseId: string;
  onSnippetSelect: (snippet: EvidenceSnippet | null) => void;
}

const getIconForType = (type: EvidenceSnippet['type']) => {
    switch (type) {
        case 'message': return <DocumentTextIcon className="h-5 w-5" />;
        case 'file': return <PhotographIcon className="h-5 w-5" />;
        case 'log': return <TerminalIcon className="h-5 w-5" />;
        default: return <ClockIcon className="h-5 w-5" />;
    }
}

const TimelineView: React.FC<TimelineViewProps> = ({ caseId, onSnippetSelect }) => {
    const { isDemoMode, getSampleCaseEvidence } = useDemo();
    const [evidence, setEvidence] = useState<EvidenceSnippet[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAll, setShowAll] = useState(false); // Filter toggle
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set()); // Track collapsed date sections

    useEffect(() => {
        const loadEvidence = async () => {
            try {
                setLoading(true);
                setError(null);

                if (isDemoMode) {
                    // Use sample data in demo mode
                    const sampleEvidence = getSampleCaseEvidence(caseId);
                    setEvidence(sampleEvidence);
                } else {
                    // Load evidence for specific case from API
                    const data = await evidenceApi.list({ case_id: caseId });
                    // Ensure data is an array
                    const evidenceArray = Array.isArray(data) ? data : [];
                    setEvidence(evidenceArray);
                }
            } catch (error) {
                console.error('Error loading evidence:', error);
                if (isDemoMode) {
                    setError('Demo mode: Unable to load sample evidence data.');
                } else {
                    setError('Failed to load timeline data. Please try again.');
                }
                setEvidence([]);
            } finally {
                setLoading(false);
            }
        };
        loadEvidence();
        
        // Load collapsed state from localStorage
        const saved = localStorage.getItem(`timeline-collapsed-${caseId}`);
        if (saved) {
            setCollapsedDates(new Set(JSON.parse(saved)));
        }
    }, [caseId, isDemoMode, getSampleCaseEvidence]);

    // Calculate anomaly scores for evidence items
    const enrichedEvidence = useMemo(() => {
        return evidence.map(item => {
            const content = item.content.toLowerCase();
            let anomalyScore = 0.0;
            let intentFlag = 'normal';
            
            // Check for generic patterns
            if (content.includes('hello, this is message number')) {
                anomalyScore = 0.1;
                intentFlag = 'generic';
            }
            // Check for critical keywords
            else if (content.match(/\b(meet|send money|deliver|hide|delete|destroy|plan|transaction|transfer|urgent|tonight|tomorrow|secret)\b/)) {
                anomalyScore = 0.7;
                intentFlag = 'critical';
            }
            // Check for suspicious keywords
            else if (content.match(/\b(unusual|weird|strange|anonymous|unknown|foreign|late night|midnight|cash|untraceable)\b/)) {
                anomalyScore = 0.4;
                intentFlag = 'anomalous';
            }
            
            return { ...item, anomaly_score: anomalyScore, intent_flag: intentFlag };
        });
    }, [evidence]);

    const sortedEvidence = useMemo(() => 
        [...enrichedEvidence].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [enrichedEvidence]
    );
    
    // Filter evidence based on toggle
    const filteredEvidence = useMemo(() => {
        if (showAll) {
            return sortedEvidence;
        }
        // Filter out generic messages
        return sortedEvidence.filter(item => item.intent_flag !== 'generic');
    }, [sortedEvidence, showAll]);
    
    // Group by date
    const groupedByDate = useMemo(() => {
        const grouped: Record<string, typeof filteredEvidence> = {};
        filteredEvidence.forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            });
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(item);
        });
        return grouped;
    }, [filteredEvidence]);
    
    const filteredCount = sortedEvidence.length - filteredEvidence.length;
    
    const toggleDateCollapse = (date: string) => {
        const newCollapsed = new Set(collapsedDates);
        if (newCollapsed.has(date)) {
            newCollapsed.delete(date);
        } else {
            newCollapsed.add(date);
        }
        setCollapsedDates(newCollapsed);
        
        // Save to localStorage
        localStorage.setItem(`timeline-collapsed-${caseId}`, JSON.stringify(Array.from(newCollapsed)));
    };
    
    // Get color based on anomaly score
    const getColorClass = (anomalyScore: number = 0, intentFlag: string = 'normal') => {
        if (intentFlag === 'critical' || anomalyScore >= 0.7) {
            return {
                border: 'border-red-500/50',
                bg: 'bg-red-900/20',
                icon: 'border-red-500 text-red-400',
                badge: 'bg-red-500/20 text-red-300'
            };
        } else if (intentFlag === 'anomalous' || anomalyScore >= 0.3) {
            return {
                border: 'border-orange-500/50',
                bg: 'bg-orange-900/20',
                icon: 'border-orange-500 text-orange-400',
                badge: 'bg-orange-500/20 text-orange-300'
            };
        } else if (intentFlag === 'generic') {
            return {
                border: 'border-slate-600/50',
                bg: 'bg-slate-800/20',
                icon: 'border-slate-600 text-slate-500',
                badge: 'bg-slate-500/20 text-slate-400'
            };
        } else {
            return {
                border: 'border-cyan-500/50',
                bg: 'bg-cyan-900/10',
                icon: 'border-cyan-500 text-cyan-300',
                badge: 'bg-green-500/20 text-green-300'
            };
        }
    };

    return (
        <div className="p-6 lg:p-8">
             <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">Evidence Timeline</h1>
                        {isDemoMode && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                                DEMO MODE
                            </span>
                        )}
                    </div>
                    
                    {/* Filter Toggle */}
                    <div className="flex items-center gap-3">
                        {filteredCount > 0 && !showAll && (
                            <span className="text-xs text-slate-400">
                                {filteredCount} generic items hidden
                            </span>
                        )}
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                showAll
                                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                                    : 'bg-cyan-600 text-white hover:bg-cyan-500'
                            }`}
                        >
                            {showAll ? '📋 Show All' : '⭐ Show Significant'}
                        </button>
                    </div>
                </div>
                <p className="text-slate-400 mt-2">
                    {isDemoMode
                        ? "A chronological view of sample evidence items for this demo case."
                        : "A chronological view of all evidence items for this case."
                    }
                </p>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-400">🔴 Critical</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-slate-400">🟠 Anomalous</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-400">🟢 Normal</span>
                    </div>
                    {showAll && (
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                            <span className="text-slate-400">⚪ Generic</span>
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-red-500/10 border border-red-500 rounded-md p-3">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-white">Loading timeline...</div>
                </div>
            ) : sortedEvidence.length === 0 ? (
                <div className="text-center py-20 text-slate-400 rounded-lg border border-dashed border-slate-700">
                    <p className="font-semibold">No evidence found.</p>
                    <p className="text-sm mt-1">Timeline will appear when evidence is added.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedByDate).map(([date, dateEvidence]) => {
                        const isCollapsed = collapsedDates.has(date);
                        const criticalCount = dateEvidence.filter(e => e.intent_flag === 'critical').length;
                        const anomalousCount = dateEvidence.filter(e => e.intent_flag === 'anomalous').length;
                        
                        return (
                            <div key={date} className="space-y-3">
                                {/* Date Header - Collapsible */}
                                <button
                                    onClick={() => toggleDateCollapse(date)}
                                    className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800/70 border border-slate-700 rounded-lg transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <svg 
                                            className={`w-4 h-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                                            fill="none" 
                                            viewBox="0 0 24 24" 
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <span className="text-lg font-semibold text-white">{date}</span>
                                        <span className="text-sm text-slate-400">({dateEvidence.length} events)</span>
                                    </div>
                                    
                                    {/* Badges for critical/anomalous counts */}
                                    <div className="flex items-center gap-2">
                                        {criticalCount > 0 && (
                                            <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs font-medium rounded">
                                                {criticalCount} critical
                                            </span>
                                        )}
                                        {anomalousCount > 0 && (
                                            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-medium rounded">
                                                {anomalousCount} anomalous
                                            </span>
                                        )}
                                    </div>
                                </button>
                                
                                {/* Events for this date */}
                                {!isCollapsed && (
                                    <div className="relative border-l-2 border-slate-700/50 ml-4">
                                        {dateEvidence.map((snippet, index) => {
                                            const colors = getColorClass(snippet.anomaly_score, snippet.intent_flag);
                                            
                                            return (
                                                <div key={snippet.id} className="mb-6 flex items-start">
                                                    <div className={`absolute -left-4 bg-slate-800 border-2 ${colors.icon} rounded-full h-8 w-8 flex items-center justify-center`}>
                                                       {getIconForType(snippet.type)}
                                                    </div>
                                                    <div className="ml-10 w-full">
                                                        <div 
                                                            className={`p-4 rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-lg cursor-pointer transition-all hover:shadow-lg`}
                                                            onClick={() => onSnippetSelect(snippet)}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-semibold text-gray-200">{snippet.source}</p>
                                                                    {snippet.intent_flag && snippet.intent_flag !== 'normal' && (
                                                                        <span className={`px-2 py-0.5 ${colors.badge} text-xs font-medium rounded uppercase`}>
                                                                            {snippet.intent_flag === 'critical' ? '🚨' : snippet.intent_flag === 'anomalous' ? '⚠️' : ''}
                                                                            {snippet.intent_flag}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs font-mono text-slate-400">
                                                                    {new Date(snippet.timestamp).toLocaleTimeString()}
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-slate-400 mb-2">{snippet.device}</p>
                                                            <p className="text-sm text-slate-300 bg-black/20 p-2 rounded-md">{snippet.content}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TimelineView;
