
import React, { useState, useEffect, useMemo } from 'react';
import { evidenceApi } from '@/lib/api';
import { EvidenceSnippet } from '../../types';
import { DocumentTextIcon, PhotographIcon, TerminalIcon, ClockIcon } from '../icons';
import { useDemo } from '@/contexts/DemoContext';

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
    }, [caseId, isDemoMode, getSampleCaseEvidence]);

    const sortedEvidence = useMemo(() => 
        [...evidence].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [evidence]
    );

    return (
        <div className="p-6 lg:p-8">
             <div className="mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Evidence Timeline</h1>
                    {isDemoMode && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs font-medium rounded-full">
                            DEMO MODE
                        </span>
                    )}
                </div>
                <p className="text-slate-400">
                    {isDemoMode
                        ? "A chronological view of sample evidence items for this demo case."
                        : "A chronological view of all evidence items for this case."
                    }
                </p>
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
                <div className="relative border-l-2 border-slate-700/50 ml-4">
                {sortedEvidence.map((snippet, index) => (
                    <div key={snippet.id} className="mb-8 flex items-start">
                        <div className="absolute -left-4 bg-slate-800 border-2 border-cyan-500/50 rounded-full h-8 w-8 flex items-center justify-center text-cyan-300">
                           {getIconForType(snippet.type)}
                        </div>
                        <div className="ml-10 w-full">
                            <div 
                                className="p-4 rounded-xl border border-white/10 backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0 cursor-pointer transition-all hover:border-cyan-400/50"
                                onClick={() => onSnippetSelect(snippet)}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-200">{snippet.source}</p>
                                        <p className="text-xs text-slate-400">{snippet.device}</p>
                                    </div>
                                    <p className="text-xs font-mono text-cyan-300 bg-slate-800/50 px-2 py-1 rounded">
                                        {new Date(snippet.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <p className="mt-2 text-sm text-slate-300 bg-black/20 p-2 rounded-md">{snippet.content}</p>
                            </div>
                        </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
};

export default TimelineView;
