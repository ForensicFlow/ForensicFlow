import React, { useState } from 'react';
import { casesApi } from '@/lib/api.ts';
import { useToast } from '@/contexts/ToastContext.tsx';

interface CaseStatusManagerProps {
  caseId: string;
  currentStatus: 'Active' | 'Closed' | 'Archived';
  caseName: string;
  onStatusChange: (newStatus: 'Active' | 'Closed' | 'Archived') => void;
  onCaseDeleted: () => void;
}

const CaseStatusManager: React.FC<CaseStatusManagerProps> = ({
  caseId,
  currentStatus,
  caseName,
  onStatusChange,
  onCaseDeleted
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { success, error: showError } = useToast();

  const changeStatus = async (newStatus: 'Active' | 'Closed' | 'Archived') => {
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      await casesApi.changeStatus(caseId, newStatus);
      success(`Case marked as ${newStatus}`);
      onStatusChange(newStatus);
      setShowMenu(false);
    } catch (err: any) {
      showError(err.message || 'Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const deleteCase = async () => {
    setLoading(true);
    try {
      await casesApi.delete(caseId);
      success('Case deleted permanently');
      onCaseDeleted();
    } catch (err: any) {
      showError(err.message || 'Failed to delete case');
      setLoading(false);
    }
  };

  return (
    <>
      {/* Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border bg-slate-800 hover:bg-slate-700 border-slate-600 text-white transition-colors"
          disabled={loading}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Manage Status
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowMenu(false)}
            />

            {/* Menu */}
            <div className="absolute top-full right-0 mt-2 w-56 bg-slate-800 rounded-lg border border-slate-700 shadow-xl z-20 overflow-hidden">
              <div className="p-2 border-b border-slate-700">
                <p className="text-xs text-slate-400 font-medium px-2 py-1">CHANGE STATUS</p>
              </div>

              <div className="p-2 space-y-1">
                {/* Active */}
                <button
                  onClick={() => changeStatus('Active')}
                  disabled={currentStatus === 'Active' || loading}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentStatus === 'Active'
                      ? 'bg-green-500/20 text-green-300 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {currentStatus === 'Active' ? (
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-green-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Active</p>
                    <p className="text-xs text-slate-400">Currently investigating</p>
                  </div>
                </button>

                {/* Closed */}
                <button
                  onClick={() => changeStatus('Closed')}
                  disabled={currentStatus === 'Closed' || loading}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentStatus === 'Closed'
                      ? 'bg-red-500/20 text-red-300 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {currentStatus === 'Closed' ? (
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-red-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Closed</p>
                    <p className="text-xs text-slate-400">Investigation complete</p>
                  </div>
                </button>

                {/* Archived */}
                <button
                  onClick={() => changeStatus('Archived')}
                  disabled={currentStatus === 'Archived' || loading}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentStatus === 'Archived'
                      ? 'bg-yellow-500/20 text-yellow-300 cursor-not-allowed'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {currentStatus === 'Archived' ? (
                      <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-yellow-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Archived</p>
                    <p className="text-xs text-slate-400">Long-term storage</p>
                  </div>
                </button>
              </div>

              {/* Danger Zone */}
              <div className="p-2 border-t border-slate-700">
                <p className="text-xs text-red-400 font-medium px-2 py-1 mb-1">DANGER ZONE</p>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  disabled={loading}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span className="font-medium">Delete Case</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 rounded-xl border border-red-500/30 shadow-2xl max-w-md w-full animate-slideUp">
            {/* Header */}
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-500/20 rounded-lg">
                  <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">Delete Case?</h3>
                  <p className="text-sm text-slate-300">
                    This will permanently delete <span className="font-semibold text-white">"{caseName}"</span> and ALL related data:
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-300 font-medium mb-2">⚠️ This action cannot be undone!</p>
                <ul className="text-xs text-red-200/80 space-y-1 ml-4 list-disc">
                  <li>All evidence items</li>
                  <li>All uploaded files</li>
                  <li>All queries and AI insights</li>
                  <li>All reports and chat sessions</li>
                  <li>All audit logs for this case</li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-700 flex items-center gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteCase}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CaseStatusManager;

