import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.tsx';
import { useToast } from '@/contexts/ToastContext.tsx';
import Logo from '@/components/Logo';
import AuthErrorAlert from '@/components/auth/AuthErrorAlert';
import { parseAuthError } from '@/utils/errorParser';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { success, error: showError } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    employee_id: '',
    department: '',
    phone_number: '',
  });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState<{ message: string; type: any } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorAlert(null);

    // Validate passwords match
    if (formData.password !== formData.password_confirm) {
      setErrorAlert({
        message: 'Passwords do not match. Please ensure both password fields are identical.',
        type: 'error'
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await register(formData);
      success('Registration successful! You can now login with your credentials.');
      setRegistrationSuccess(true);
      // Clear form
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        employee_id: '',
        department: '',
        phone_number: '',
      });
    } catch (err: any) {
      const parsedError = parseAuthError(err);
      setErrorAlert(parsedError);
      // Only show the AuthErrorAlert component, no toast notification
    } finally {
      setIsLoading(false);
    }
  };

  if (registrationSuccess) {
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
              Registration Successful!
            </h2>
            <p className="text-slate-300 mb-6">
              Your account has been created successfully.
              You can now log in with your credentials.
            </p>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      {/* Error Alert - Fixed Top Right */}
      {errorAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <AuthErrorAlert
            message={errorAlert.message}
            type={errorAlert.type}
            onClose={() => setErrorAlert(null)}
          />
        </div>
      )}

      <div className="max-w-2xl w-full space-y-8">
        {/* Back to Home Button */}
        <div className="flex justify-start">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-medium">Back to Home</span>
          </button>
        </div>
        
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <Logo size={80} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Create Your Account
          </h2>
          <p className="text-slate-300">
            Join ForensicFlow to start your forensic analysis
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-white mb-2">
                  Username *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Choose a username"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="your.email@agency.gov"
                />
              </div>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-white mb-2">
                  First Name *
                </label>
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="John"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-white mb-2">
                  Last Name *
                </label>
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Doe"
                />
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="employee_id" className="block text-sm font-medium text-white mb-2">
                  Employee ID
                </label>
                <input
                  id="employee_id"
                  name="employee_id"
                  type="text"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="EMP001"
                />
              </div>

              <div>
                <label htmlFor="department" className="block text-sm font-medium text-white mb-2">
                  Department
                </label>
                <input
                  id="department"
                  name="department"
                  type="text"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Cybercrime Division"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-white mb-2">
                Phone Number
              </label>
              <input
                id="phone_number"
                name="phone_number"
                type="tel"
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="+1 234 567 8900"
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Password *
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="password_confirm" className="block text-sm font-medium text-white mb-2">
                  Confirm Password *
                </label>
                <input
                  id="password_confirm"
                  name="password_confirm"
                  type="password"
                  required
                  value={formData.password_confirm}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="••••••••"
                />
              </div>
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-slate-300 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-blue-300 font-semibold text-sm mb-1">Instant Access</h3>
              <p className="text-blue-200 text-xs">
                Your account will be created immediately and you can start using ForensicFlow right away.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;


