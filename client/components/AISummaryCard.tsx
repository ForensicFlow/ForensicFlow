import React from 'react';
import { SparklesIcon, ShieldExclamationIcon } from './icons';

interface AISummaryCardProps {
    query: string;
    summary: string;
    isLoading: boolean;
    error: string | null;
}

const AISummaryCard: React.FC<AISummaryCardProps> = ({ query, summary, isLoading, error }) => {
    return (
        <div className={`mb-8 rounded-xl border p-5 backdrop-blur-sm transition-all
            ${error ? 'border-red-500/30 bg-red-900/20' : 'border-cyan-500/30 bg-cyan-900/20'}`}
        >
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 rounded-full p-2
                    ${error ? 'bg-red-500/20 text-red-300' : 'bg-cyan-500/20 text-cyan-300'}`}
                >
                    {error ? <ShieldExclamationIcon className="h-6 w-6" /> : <SparklesIcon className="h-6 w-6" />}
                </div>
                <div>
                    <h2 className={`text-lg font-semibold ${error ? 'text-red-300' : 'text-cyan-300'}`}>
                        {error ? 'An Error Occurred' : 'AI Summary & Key Entities'}
                    </h2>
                    
                    {isLoading ? (
                        <div className="mt-2 space-y-2">
                            <div className="h-4 bg-slate-700/50 rounded w-3/4 animate-pulse"></div>
                            <div className="h-4 bg-slate-700/50 rounded w-1/2 animate-pulse"></div>
                        </div>
                    ) : (
                        <p className={`mt-1 text-sm ${error ? 'text-red-100/80' : 'text-cyan-100/80'}`}>
                            {error || summary}
                        </p>
                    )}
                    
                    {query && !isLoading && !error && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium text-slate-300">
                                Query: "{query}"
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AISummaryCard;
