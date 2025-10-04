import React, { useState, useEffect } from 'react';

interface SessionTimeoutWarningProps {
  remainingTime: number;
  onExtend: () => void;
  onLogout: () => void;
}

const SessionTimeoutWarning: React.FC<SessionTimeoutWarningProps> = ({
  remainingTime,
  onExtend,
  onLogout,
}) => {
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-800 border border-yellow-500/50 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 bg-yellow-500/20 rounded-full mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Session Expiring Soon
        </h2>
        
        <p className="text-slate-300 text-center mb-6">
          Your session will expire in{' '}
          <span className="font-mono font-bold text-yellow-400">
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          {' '}due to inactivity. Would you like to continue?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onLogout}
            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition"
          >
            Logout
          </button>
          <button
            onClick={onExtend}
            className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutWarning;

