import React from 'react';

export type AuthErrorType = 'error' | 'warning' | 'info' | 'pending_approval';

interface AuthErrorAlertProps {
  message: string;
  type?: AuthErrorType;
  onClose?: () => void;
  className?: string;
}

const AuthErrorAlert: React.FC<AuthErrorAlertProps> = ({ 
  message, 
  type = 'error', 
  onClose,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'pending_approval':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getConfig = () => {
    switch (type) {
      case 'pending_approval':
        return {
          bgColor: 'bg-amber-500/15',
          borderColor: 'border-amber-500/40',
          textColor: 'text-amber-200',
          iconColor: 'text-amber-400',
          titleColor: 'text-amber-100',
          title: 'Account Pending Approval',
        };
      case 'error':
        return {
          bgColor: 'bg-red-500/15',
          borderColor: 'border-red-500/40',
          textColor: 'text-red-200',
          iconColor: 'text-red-400',
          titleColor: 'text-red-100',
          title: 'Registration Error',
        };
      case 'warning':
        return {
          bgColor: 'bg-yellow-500/15',
          borderColor: 'border-yellow-500/40',
          textColor: 'text-yellow-200',
          iconColor: 'text-yellow-400',
          titleColor: 'text-yellow-100',
          title: 'Attention Required',
        };
      case 'info':
        return {
          bgColor: 'bg-blue-500/15',
          borderColor: 'border-blue-500/40',
          textColor: 'text-blue-200',
          iconColor: 'text-blue-400',
          titleColor: 'text-blue-100',
          title: 'Information',
        };
    }
  };

  const config = getConfig();

  return (
    <div
      className={`
        ${config.bgColor} ${config.borderColor}
        backdrop-blur-md rounded-xl border-2 shadow-2xl
        animate-slideDown
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={`flex-shrink-0 ${config.iconColor} mt-0.5`}>
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-bold text-base mb-2 ${config.titleColor}`}>
            {config.title}
          </h3>
          <p className={`text-sm leading-relaxed ${config.textColor}`}>
            {message}
          </p>
          
          {type === 'pending_approval' && (
            <div className="mt-3 pt-3 border-t border-amber-500/20">
              <p className="text-xs text-amber-300/80">
                Please contact your system administrator for account activation.
              </p>
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className={`flex-shrink-0 ${config.iconColor} hover:opacity-70 transition-opacity p-1 rounded-lg hover:bg-white/5`}
            aria-label="Close alert"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default AuthErrorAlert;
