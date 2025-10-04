import React from 'react';
import { LockClosedIcon, SparklesIcon } from './icons';

interface LockedFeatureBannerProps {
  featureName?: string;
  message?: string;
  onSignUp?: () => void;
  onLogin?: () => void;
  variant?: 'banner' | 'overlay' | 'inline';
}

const LockedFeatureBanner: React.FC<LockedFeatureBannerProps> = ({
  featureName,
  message,
  onSignUp,
  onLogin,
  variant = 'banner'
}) => {
  const defaultMessage = featureName 
    ? `${featureName} is locked in demo mode` 
    : 'This feature is locked in demo mode';

  if (variant === 'overlay') {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
        <div className="max-w-md w-full mx-4">
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-lg rounded-2xl border border-cyan-500/30 p-8 shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-cyan-500/10 rounded-full">
                <LockClosedIcon className="h-12 w-12 text-cyan-400" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white text-center mb-3">
              Feature Locked
            </h3>
            
            <p className="text-slate-300 text-center mb-6">
              {message || defaultMessage}. Sign up now to unlock all features and start your own investigations.
            </p>
            
            <div className="flex flex-col gap-3">
              {onSignUp && (
                <button 
                  onClick={onSignUp}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold rounded-lg shadow-lg shadow-cyan-500/30 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Sign Up for Free
                </button>
              )}
              
              {onLogin && (
                <button 
                  onClick={onLogin}
                  className="w-full px-6 py-3 border-2 border-white/20 hover:border-white/40 text-white font-semibold rounded-lg backdrop-blur-md hover:bg-white/5 transition-all"
                >
                  Already have an account? Login
                </button>
              )}
            </div>
            
            <p className="text-xs text-slate-400 text-center mt-4">
              Free registration • Full access after approval
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="rounded-lg border border-cyan-500/30 bg-slate-800/50 backdrop-blur-sm p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <LockClosedIcon className="h-5 w-5 text-cyan-400" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white mb-1">
              {featureName || 'Feature'} Locked
            </h4>
            <p className="text-xs text-slate-300 mb-3">
              {message || defaultMessage}. Unlock this feature with a free account.
            </p>
            <div className="flex gap-2">
              {onSignUp && (
                <button 
                  onClick={onSignUp}
                  className="px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded transition-all"
                >
                  Sign Up Free
                </button>
              )}
              {onLogin && (
                <button 
                  onClick={onLogin}
                  className="px-3 py-1.5 border border-white/20 hover:border-white/40 text-white text-xs font-semibold rounded transition-all"
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default banner variant
  return (
    <div className="sticky top-0 z-40 border-b border-cyan-500/30 bg-gradient-to-r from-slate-800/95 to-slate-900/95 backdrop-blur-lg">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <LockClosedIcon className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                <span className="text-cyan-400">Demo Mode</span> - Read-only access
              </p>
              <p className="text-xs text-slate-400">
                {message || defaultMessage}. Sign up to unlock all features.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onSignUp && (
              <button 
                onClick={onSignUp}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <SparklesIcon className="h-4 w-4" />
                Sign Up Free
              </button>
            )}
            {onLogin && (
              <button 
                onClick={onLogin}
                className="px-4 py-2 border border-white/20 hover:border-white/40 text-white text-sm font-semibold rounded-lg backdrop-blur-md hover:bg-white/5 transition-all"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockedFeatureBanner;

