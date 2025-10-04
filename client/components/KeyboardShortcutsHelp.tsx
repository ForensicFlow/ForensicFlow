import React, { useEffect } from 'react';
import { getModKeyDisplay } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcut {
  keys: string;
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: KeyboardShortcut[];
}

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  const modKey = getModKeyDisplay();

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: '🔑 Global Shortcuts',
      shortcuts: [
        { keys: 'Esc', description: 'Close popup, panel, or go back' },
        { keys: `${modKey} + K`, description: 'Global search (focus search bar)' },
        { keys: `${modKey} + /`, description: 'Show this help overlay' },
        { keys: `${modKey} + H`, description: 'Go to Home / Dashboard' },
        { keys: `${modKey} + L`, description: 'Logout' },
        { keys: `${modKey} + N`, description: 'Create new case' },
        { keys: `${modKey} + Shift + S`, description: 'Save progress (future)' },
      ],
    },
    {
      title: '📁 Case Management',
      shortcuts: [
        { keys: 'C', description: 'Open Cases listing' },
        { keys: 'O', description: 'Open selected case (future)' },
        { keys: 'E', description: 'Export report (if available)' },
        { keys: 'D', description: 'Delete selected item (future)' },
        { keys: 'F', description: 'Flag evidence / mark important (future)' },
      ],
    },
    {
      title: '📊 Data Analysis & Visualization',
      shortcuts: [
        { keys: 'T', description: 'Timeline view (in case detail)' },
        { keys: 'G', description: 'Graph / Network analysis view' },
        { keys: 'M', description: 'Map / GPS heatmap view (future)' },
        { keys: 'A', description: 'AI insights / FlowBot panel' },
        { keys: 'R', description: 'Reports view' },
      ],
    },
    {
      title: '👥 User & Mode Switching',
      shortcuts: [
        { keys: 'Shift + G', description: 'Switch to Guest Mode (future)' },
        { keys: 'Shift + U', description: 'User Dashboard (future)' },
        { keys: 'Shift + A', description: 'Admin panel (admin only, future)' },
      ],
    },
  ];

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Keyboard Shortcuts</h2>
            <p className="text-slate-400 text-sm">Master these shortcuts to work faster</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category, idx) => (
            <div key={idx}>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">{category.title}</h3>
              <div className="space-y-3">
                {category.shortcuts.map((shortcut, sIdx) => (
                  <div key={sIdx} className="flex items-start justify-between gap-4">
                    <span className="text-slate-300 text-sm flex-1">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-cyan-300 whitespace-nowrap flex-shrink-0">
                      {shortcut.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 p-4 text-center">
          <p className="text-slate-500 text-sm">
            Press <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs font-mono text-slate-400">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;

