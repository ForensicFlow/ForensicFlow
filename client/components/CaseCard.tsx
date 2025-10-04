
import React from 'react';
import { Case } from '../types';
import { UserGroupIcon } from './icons';

interface CaseCardProps {
    caseInfo: Case;
    onClick?: () => void;
}

// Helper function to safely display numbers
const safeNumber = (value: any, fallback: number = 0): number => {
    const num = typeof value === 'number' ? value : parseInt(value);
    return isNaN(num) ? fallback : num;
};

// Helper function to safely format dates
const safeDate = (dateValue: any): string => {
    // If no date provided, return "Just now"
    if (!dateValue) {
        return 'Just now';
    }

    try {
        const date = new Date(dateValue);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Just now';
        }

        // Format the date
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Today';
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Just now';
    }
};

const getStatusColor = (status: Case['status']) => {
    switch (status) {
        case 'Active': return 'bg-green-500/20 text-green-300';
        case 'Archived': return 'bg-yellow-500/20 text-yellow-300';
        case 'Closed': return 'bg-slate-500/20 text-slate-300';
    }
}

const CaseCard: React.FC<CaseCardProps> = ({ caseInfo, onClick }) => {
    return (
        <div 
            onClick={onClick}
            className="rounded-xl border border-white/10 p-5 shadow-2xl shadow-black/40 backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0 transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1 cursor-pointer"
        >
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-100">{caseInfo.name}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(caseInfo.status)}`}>
                    {caseInfo.status}
                </span>
            </div>
            <p className="text-sm text-slate-400 mt-2">
                Last updated: {safeDate(caseInfo.lastModified || caseInfo.last_modified || caseInfo.updated_at || caseInfo.created_at)}
            </p>
            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-sm">
                <div className="text-slate-300">
                    <span className="font-semibold text-white">{safeNumber(caseInfo.evidenceCount, 0)}</span> evidence items
                </div>
                <div className="flex items-center text-slate-300">
                    <UserGroupIcon className="h-5 w-5 mr-2" />
                    <div className="flex -space-x-2">
                        {caseInfo.investigators.slice(0, 3).map((investigator, i) => {
                            const name = typeof investigator === 'string'
                                ? investigator
                                : `${investigator.first_name} ${investigator.last_name}`;
                            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2);
                            return (
                                <div key={i} title={name} className="h-7 w-7 rounded-full bg-slate-700 ring-2 ring-slate-800 flex items-center justify-center text-xs font-bold">
                                    {initials}
                                </div>
                            );
                        })}
                        {caseInfo.investigators.length > 3 && (
                            <div className="h-7 w-7 rounded-full bg-slate-700 ring-2 ring-slate-800 flex items-center justify-center text-xs font-bold">
                                +{safeNumber(caseInfo.investigators.length - 3, 0)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaseCard;
