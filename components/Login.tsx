import React, { useState, useEffect } from 'react';
import { Zap, Loader2, Check, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

// Placeholder for Google Type
declare global {
  interface Window {
    google: any;
  }
}

export const Login: React.FC = () => {
  const { login, register, loginWithGoogle } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // INITIALIZE GOOGLE BUTTON
  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          // IMPORTANT: Replace this with your actual Client ID from Google Cloud Console
          client_id: "YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com",
          callback: (response: any) => {
            // Handle the ID token returned by Google
            if (response.credential) {
              handleGoogleLogin(response.credential);
            }
          }
        });

        const btn = document.getElementById("google-signin-btn");
        if (btn) {
           window.google.accounts.id.renderButton(
            btn,
            { theme: "outline", size: "large", width: "100%" }
          );
        }
      }
    };

    // Check if script is loaded, if not, wait for it
    if (window.google) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          initializeGoogle();
          clearInterval(interval);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [activeTab]); // Re-run when tab changes to ensure button renders

  const handleGoogleLogin = async (token: string) => {
    try {
      await loginWithGoogle(token);
      showNotification("Successfully logged in with Google", "success");
    } catch (err: any) {
      showNotification(err.message || "Google sign in failed", "error");
    }
  };

  const validatePassword = (pwd: string) => {
    return {
      hasCapital: /[A-Z]/.test(pwd),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasLength: pwd.length >= 6,
      noSpaces: !/\s/.test(pwd)
    };
  };

  const passwordChecks = validatePassword(formData.password);
  const isPasswordValid = Object.values(passwordChecks).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeTab === 'register' && !isPasswordValid) {
      showNotification("Please ensure your password meets all requirements.", "error");
      return;
    }

    setIsLoading(true);

    try {
      if (activeTab === 'register') {
        await register(formData.email, formData.password, formData.name);
        showNotification("Account created successfully!", "success");
      } else {
        await login(formData.email, formData.password);
        showNotification("Welcome back!", "success");
      }
    } catch (err: any) {
      // Show descriptive error message in toast
      showNotification(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setFormData({ name: '', email: '', password: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center">
            <Zap className="w-10 h-10 text-brand-500 mr-2" />
            <span className="text-3xl font-bold text-slate-900">SEO Auditor<span className="text-brand-500">.ai</span></span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Welcome Back
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white shadow-xl shadow-slate-200 sm:rounded-xl border border-slate-100 overflow-hidden">
          
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                activeTab === 'login' 
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${
                activeTab === 'register' 
                  ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              Register
            </button>
          </div>

          <div className="py-8 px-4 sm:px-10">
            {/* Google Login Section */}
            <div className="mb-6">
              <div id="google-signin-btn" className="w-full flex justify-center h-[44px]"></div>
              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Or continue with email</span>
                </div>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {activeTab === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                    Full Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={activeTab === 'register' ? "new-password" : "current-password"}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {activeTab === 'register' && (
                  <div className="mt-4 space-y-2 bg-slate-50 p-3 rounded-md border border-slate-100">
                    <p className="text-xs font-medium text-slate-500 mb-2">Password must contain:</p>
                    <ul className="grid grid-cols-1 gap-1">
                      <PasswordRequirement label="At least one capital letter" met={passwordChecks.hasCapital} />
                      <PasswordRequirement label="At least one special character" met={passwordChecks.hasSpecial} />
                      <PasswordRequirement label="At least one number" met={passwordChecks.hasNumber} />
                      <PasswordRequirement label="Minimum 6 characters" met={passwordChecks.hasLength} />
                      <PasswordRequirement label="No blank spaces" met={passwordChecks.noSpaces} />
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading || (activeTab === 'register' && !isPasswordValid)}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    activeTab === 'register' ? 'Create Account' : 'Sign In'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const PasswordRequirement = ({ label, met }: { label: string, met: boolean }) => (
  <li className={`flex items-center text-xs ${met ? 'text-green-600' : 'text-slate-400'}`}>
    {met ? <Check className="w-3 h-3 mr-2 flex-shrink-0" /> : <div className="w-3 h-3 mr-2 border border-slate-300 rounded-full flex-shrink-0" />}
    {label}
  </li>
);