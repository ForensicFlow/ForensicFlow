import React, { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext.tsx';
import { authApi } from '@/lib/api.ts';
import Logo from '@/components/Logo';

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin }) => {
  const { success, error: showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [formData, setFormData] = useState({
    new_password: '',
    new_password_confirm: '',
  });
  const [urlParams, setUrlParams] = useState<{ uid: string; token: string } | null>(null);

  useEffect(() => {
    // Extract uid and token from URL
    const params = new URLSearchParams(window.location.search);
    const uid = params.get('uid');
    const token = params.get('token');
    
    if (uid && token) {
      setUrlParams({ uid, token });
    } else {
      showError('Invalid reset link. Please request a new password reset.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!urlParams) {
      showError('Invalid reset link');
      return;
    }

    if (formData.new_password !== formData.new_password_confirm) {
      showError('Passwords do not match');
      return;
    }

    if (formData.new_password.length < 8) {
      showError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);

    try {
      await authApi.confirmPasswordReset(
        urlParams.uid,
        urlParams.token,
        formData.new_password,
        formData.new_password_confirm
      );
      success('Password reset successfully!');
      setResetSuccess(true);
    } catch (err: any) {
      showError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size={80} />
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-slate-300 mb-6">
              Your password has been changed successfully. You can now login with your new password.
            </p>
            
            <button
              onClick={onBackToLogin}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!urlParams) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h2>
            <p className="text-slate-300 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <button
              onClick={onBackToLogin}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size={80} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Reset Your Password
          </h2>
          <p className="text-slate-300">
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-white mb-2">
                New Password
              </label>
              <input
                id="new_password"
                name="new_password"
                type="password"
                required
                value={formData.new_password}
                onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label htmlFor="new_password_confirm" className="block text-sm font-medium text-white mb-2">
                Confirm New Password
              </label>
              <input
                id="new_password_confirm"
                name="new_password_confirm"
                type="password"
                required
                value={formData.new_password_confirm}
                onChange={(e) => setFormData({ ...formData, new_password_confirm: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Resetting...
                </span>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onBackToLogin}
                className="text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20">
          <h3 className="text-blue-300 font-semibold text-sm mb-2">Password Requirements:</h3>
          <ul className="text-blue-200 text-xs space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Mix of uppercase and lowercase letters</li>
            <li>• At least one number</li>
            <li>• At least one special character</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;

