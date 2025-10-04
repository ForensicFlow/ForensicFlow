import React from 'react';
import { EvidenceSnippet } from '../types';
import { DocumentDuplicateIcon, FlagIcon, ShareIcon, ShieldCheckIcon } from './icons';

interface ResultCardProps {
  snippet: EvidenceSnippet;
  isSelected: boolean;
  onSelect: () => void;
}

const ResultCard: React.FC<ResultCardProps> = ({ snippet, isSelected, onSelect }) => {
  const cardClasses = `
    w-full rounded-xl border p-4 shadow-2xl shadow-black/40 
    transition-all duration-300 cursor-pointer
    backdrop-blur-lg bg-gradient-to-br from-white/5 to-white/0
    hover:border-cyan-400/50 hover:scale-[1.01]
    ${isSelected ? 'border-cyan-400/80 scale-[1.01] ring-2 ring-cyan-400/50' : 'border-white/10'}
  `;

  const handleActionClick = (e: React.MouseEvent, action: string) => {
    e.stopPropagation();
    alert(`${action}: ${snippet.id}`);
  }

  return (
    <div className={cardClasses} role="region" aria-label="Evidence snippet" onClick={onSelect}>
      <div className="flex items-start justify-between gap-4">
        <div>
            <h3 className="font-semibold text-gray-100">{snippet.source}</h3>
            <div className="mt-1 flex items-center gap-2 text-xs text-blue-300/80">
                <span>{snippet.timestamp}</span>
                <span>·</span>
                <span>{snippet.device}</span>
                <span>·</span>
                <span className={`font-mono px-2 py-0.5 rounded ${snippet.confidence > 0.9 ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                    Confidence: {snippet.confidence.toFixed(2)}
                </span>
            </div>
        </div>
        <div className="flex-shrink-0 rounded-md bg-slate-900/50 px-2 py-1 text-xs font-mono text-cyan-300 flex items-center gap-2 border border-slate-700">
          <ShieldCheckIcon className="h-3 w-3" />
          <span>SHA256: {snippet.sha256.substring(0, 8)}…</span>
        </div>
      </div>
      
      <p className="mt-3 text-base text-gray-200 bg-black/20 p-3 rounded-md">{snippet.content}</p>
      
      <div className="mt-4 flex items-center justify-between">
         <div className="flex flex-wrap gap-2">
            {snippet.entities.map((entity, index) => (
                <span key={index} className="rounded-full bg-slate-700/80 px-3 py-1 text-xs font-medium text-slate-300">{entity.type}: {entity.value}</span>
            ))}
         </div>
         <div className="flex items-center space-x-1">
            <button onClick={(e) => handleActionClick(e, 'Pinned to report')} className="p-2 rounded-md hover:bg-white/10 text-gray-400 hover:text-cyan-300" title="Pin to Report"><DocumentDuplicateIcon className="h-5 w-5"/></button>
            <button onClick={(e) => handleActionClick(e, 'Flagged as key evidence')} className="p-2 rounded-md hover:bg-white/10 text-gray-400 hover:text-yellow-300" title="Flag as Key Evidence"><FlagIcon className="h-5 w-5"/></button>
            <button onClick={(e) => handleActionClick(e, 'Shared to case')} className="p-2 rounded-md hover:bg-white/10 text-gray-400 hover:text-purple-300" title="Share to Case"><ShareIcon className="h-5 w-5"/></button>
         </div>
      </div>
    </div>
  );
};

export default ResultCard;