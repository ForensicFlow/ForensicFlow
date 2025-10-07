import React, { useState } from 'react';
import AppShell from './components/AppShell';
import LiquidBackground from './components/LiquidBackground';
import CircuitBackground from './components/CircuitBackground';
import LandingPage from './components/views/LandingPage';
import PublicLandingPage from './components/views/PublicLandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import LockedFeatureBanner from './components/LockedFeatureBanner';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DemoProvider, useDemo } from './contexts/DemoContext';
import { KeyboardShortcutsProvider, useKeyboardShortcutsHelp } from './contexts/KeyboardShortcutsContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { AppView } from './types';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { isDemoMode, enterDemoMode, exitDemoMode } = useDemo();
  const { isHelpVisible, toggleHelp, hideHelp } = useKeyboardShortcutsHelp();
  const [showApp, setShowApp] = useState(false);
  const [showPublicLanding, setShowPublicLanding] = useState(true);
  const [activeView, setActiveView] = useState<AppView>(AppView.SEARCH);
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>(() => {
    // Check if we're on the reset password URL
    if (window.location.search.includes('uid=') && window.location.search.includes('token=')) {
      return 'reset-password';
    }
    return 'login';
  });

  const handleEnterApp = (view: AppView = AppView.SEARCH) => {
    setActiveView(view);
    setShowApp(true);
  };

  const handleGoHome = () => {
    setShowApp(false);
  };

  const { warning } = useToast();

  // Session timeout (30 minutes total, 2 minutes warning)
  const { showWarning: showSessionWarning, remainingTime, extendSession } = useSessionTimeout({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 2 * 60 * 1000, // 2 minutes warning
    onTimeout: async () => {
      warning('Session expired due to inactivity');
      await logout();
    },
  });

  // Global keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '/',
      ctrl: true,
      handler: () => toggleHelp(),
      description: 'Toggle keyboard shortcuts help',
    },
    {
      key: 'h',
      ctrl: true,
      handler: () => {
        if (isAuthenticated || isDemoMode) {
          handleGoHome();
        }
      },
      description: 'Go to home',
    },
    {
      key: 'l',
      ctrl: true,
      handler: async () => {
        if (isAuthenticated) {
          await logout();
        }
      },
      description: 'Logout',
    },
    {
      key: 'Escape',
      handler: () => {
        // Close help overlay if open
        if (isHelpVisible) {
          hideHelp();
        }
      },
      description: 'Close modals and overlays',
    },
  ], isAuthenticated || isDemoMode);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle demo mode entry
  const handleTryDemo = () => {
    setShowPublicLanding(false);
    setShowApp(true);
    enterDemoMode();
  };

  // Handle auth navigation from public landing
  const handleGoToLogin = () => {
    setShowPublicLanding(false);
  };

  const handleGoToRegister = () => {
    setShowPublicLanding(false);
    setAuthView('register');
  };

  // Handle exit demo mode
  const handleExitDemo = () => {
    exitDemoMode();
    setShowApp(false);
    setShowPublicLanding(true);
  };

  // Show public landing page for visitors (not authenticated)
  if (!isAuthenticated && showPublicLanding && !isDemoMode) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <CircuitBackground />
        <div className="relative z-10">
          <PublicLandingPage 
            onTryDemo={handleTryDemo}
            onLogin={handleGoToLogin}
            onRegister={handleGoToRegister}
          />
        </div>
      </div>
    );
  }

  // Show login/register/password reset if not authenticated and not on public landing
  if (!isAuthenticated && !isDemoMode) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <LiquidBackground />
        <div className="relative z-10">
          {authView === 'login' && (
            <LoginPage 
              onSwitchToRegister={() => setAuthView('register')}
              onForgotPassword={() => setAuthView('forgot-password')}
            />
          )}
          {authView === 'register' && (
            <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
          )}
          {authView === 'forgot-password' && (
            <ForgotPasswordPage onBackToLogin={() => setAuthView('login')} />
          )}
          {authView === 'reset-password' && (
            <ResetPasswordPage onBackToLogin={() => setAuthView('login')} />
          )}
        </div>
      </div>
    );
  }

  // Show main app when authenticated OR in demo mode
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <LockedFeatureBanner 
            message="You're viewing in demo mode with sample data. Features like upload, edit, and delete are disabled"
            onSignUp={handleGoToRegister}
            onLogin={handleGoToLogin}
            variant="banner"
          />
        )}
        
        {showApp ? (
          <AppShell 
            activeView={activeView} 
            setActiveView={setActiveView} 
            onGoHome={handleGoHome} 
          />
        ) : (
          <LandingPage onEnterApp={handleEnterApp} />
        )}
      </div>
      
      {/* Session Timeout Warning */}
      {isAuthenticated && showSessionWarning && (
        <SessionTimeoutWarning
          remainingTime={remainingTime}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}

      {/* Keyboard Shortcuts Help Overlay */}
      <KeyboardShortcutsHelp isOpen={isHelpVisible} onClose={hideHelp} />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DemoProvider>
          <AuthProvider>
            <KeyboardShortcutsProvider>
              <AppContent />
              <ToastContainer />
            </KeyboardShortcutsProvider>
          </AuthProvider>
        </DemoProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;