
import React from 'react';
import { EvidenceSnippet } from '../types';
import { XIcon, TagIcon, DeviceMobileIcon, CalendarIcon, ShieldCheckIcon, DownloadIcon } from './icons';

interface RightContextPaneProps {
  snippet: EvidenceSnippet | null;
  onClose: () => void;
}

const DetailRow: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode; isMono?: boolean }> = ({ icon, label, value, isMono = false }) => (
    <div className="flex items-start py-2">
        <div className="w-6 h-6 mr-3 text-slate-400 flex-shrink-0">{icon}</div>
        <div className="flex-grow">
            <div className="text-xs text-slate-400">{label}</div>
            <div className={`text-sm text-slate-200 ${isMono ? 'font-mono' : ''}`}>{value}</div>
        </div>
    </div>
);

const RightContextPane: React.FC<RightContextPaneProps> = ({ snippet, onClose }) => {
  React.useEffect(() => {
    if (snippet && window.innerWidth < 768) { // md breakpoint
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [snippet]);

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden transition-opacity ${
          snippet ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={`
          fixed top-0 right-0 h-full z-30 w-[90vw] max-w-sm 
          md:relative md:h-auto md:w-96 md:max-w-none md:translate-x-0 md:transition-all
          bg-slate-800/50 backdrop-blur-lg border-l border-white/10
          flex-shrink-0 transition-transform duration-300 ease-in-out
          ${snippet ? 'translate-x-0' : 'translate-x-full'}
          ${snippet ? 'md:w-96' : 'md:w-0'}
          overflow-hidden
        `}
      >
        <div className={`flex flex-col h-full ${snippet ? '' : 'invisible md:visible'}`}>
            <div className="flex items-center justify-between h-16 border-b border-white/10 p-4 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-200">Evidence Details</h3>
                <button onClick={onClose} className="p-2 rounded-md hover:bg-white/10 text-gray-400">
                    <XIcon className="h-6 w-6" />
                </button>
            </div>
            {snippet ? (
                <div className="flex-1 p-4 overflow-y-auto">
                    <h4 className="font-semibold text-cyan-300 mb-2">{snippet.source}</h4>
                    <p className="text-sm text-slate-300 bg-black/20 p-3 rounded-md mb-4">{snippet.content}</p>

                    <div className="space-y-2 divide-y divide-slate-700/50">
                        <DetailRow icon={<DeviceMobileIcon/>} label="Device" value={snippet.device} />
                        <DetailRow icon={<CalendarIcon/>} label="Timestamp" value={snippet.timestamp} />
                        <DetailRow icon={<ShieldCheckIcon/>} label="SHA256 Hash" value={snippet.sha256} isMono={true} />
                    </div>

                    <h4 className="font-semibold text-cyan-300 mt-6 mb-2">Extracted Entities</h4>
                    <div className="space-y-2">
                        {snippet.entities.map((entity, index) => (
                             <div key={index} className="flex items-center bg-slate-700/50 p-2 rounded-md">
                                <TagIcon className="h-4 w-4 mr-3 text-slate-400"/>
                                <div>
                                    <div className="text-xs text-slate-400">{entity.type}</div>
                                    <div className="text-sm font-medium text-slate-200">{entity.value}</div>
                                </div>
                             </div>
                        ))}
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-4">
                        <button className="w-full flex items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 transition-colors">
                            <DownloadIcon className="h-5 w-5" />
                            <span>Download Original File</span>
                        </button>
                    </div>

                </div>
            ) : (
                <div className="hidden md:flex h-full items-center justify-center text-center p-4">
                    <p className="text-slate-400">Select an evidence snippet to view its details.</p>
                </div>
            )}
        </div>
      </aside>
    </>
  );
};

export default RightContextPane;
