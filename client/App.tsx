import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import CircuitBackground from './components/CircuitBackground';
import LiquidBackground from './components/LiquidBackground';
import PublicLandingPage from './components/views/PublicLandingPage';
import LandingPage from './components/views/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import ResetPasswordPage from './components/auth/ResetPasswordPage';
import AppShell from './components/AppShell';
import SessionTimeoutWarning from './components/SessionTimeoutWarning';
import LockedFeatureBanner from './components/LockedFeatureBanner';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { DemoProvider, useDemo } from './contexts/DemoContext';
import { KeyboardShortcutsProvider, useKeyboardShortcutsHelp } from './contexts/KeyboardShortcutsContext';
import { useSessionTimeout } from './hooks/useSessionTimeout';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Public landing page with circuit background
const PublicLandingRoute: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <CircuitBackground />
      <div className="relative z-10">
        <PublicLandingPage />
      </div>
    </div>
  );
};

// Auth pages with liquid background
const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// Protected app routes with session timeout and keyboard shortcuts
const ProtectedAppLayout: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const { isDemoMode } = useDemo();
  const { warning } = useToast();
  const { isHelpVisible, toggleHelp, hideHelp } = useKeyboardShortcutsHelp();

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
      key: 'Escape',
      handler: () => {
        if (isHelpVisible) {
          hideHelp();
        }
      },
      description: 'Close modals and overlays',
    },
  ], isAuthenticated || isDemoMode);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <LiquidBackground />
      <div className="relative z-10">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <LockedFeatureBanner 
            message="You're viewing in demo mode with sample data. Features like upload, edit, and delete are disabled"
            variant="banner"
          />
        )}
        
        <Routes>
          {/* Landing page for authenticated users */}
          <Route path="/" element={<LandingPage />} />
          
          {/* App shell routes - handles view parameter internally */}
          <Route path="/*" element={<AppShell />} />
        </Routes>
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

// Main routing component
const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!isAuthenticated ? <PublicLandingRoute /> : <Navigate to="/app" replace />} />
      
      <Route path="/login" element={
        !isAuthenticated ? (
          <AuthLayout><LoginPage /></AuthLayout>
        ) : (
          <Navigate to="/app" replace />
        )
      } />
      
      <Route path="/register" element={
        !isAuthenticated ? (
          <AuthLayout><RegisterPage /></AuthLayout>
        ) : (
          <Navigate to="/app" replace />
        )
      } />
      
      <Route path="/forgot-password" element={
        <AuthLayout><ForgotPasswordPage /></AuthLayout>
      } />
      
      <Route path="/reset-password" element={
        <AuthLayout><ResetPasswordPage /></AuthLayout>
      } />
      
      {/* Protected app routes */}
      <Route path="/app/*" element={
        <ProtectedRoute>
          <ProtectedAppLayout />
        </ProtectedRoute>
      } />
      
      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <DemoProvider>
          <AuthProvider>
            <KeyboardShortcutsProvider>
              <BrowserRouter>
                <AppRoutes />
                <ToastContainer />
              </BrowserRouter>
            </KeyboardShortcutsProvider>
          </AuthProvider>
        </DemoProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;