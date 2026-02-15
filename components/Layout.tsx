import React, { useState } from 'react';
import { LayoutDashboard, Search, FileText, MessageSquare, Menu, X, Globe, Zap, LogOut, Shield } from 'lucide-react';
import { AppView } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navItems = [
    { id: AppView.DASHBOARD, label: 'Overview', icon: LayoutDashboard },
    { id: AppView.AUDIT, label: 'Site Audit', icon: Globe },
    { id: AppView.CONTENT_OPTIMIZER, label: 'Content Optimizer', icon: FileText },
    { id: AppView.ASSISTANT, label: 'AI Assistant', icon: MessageSquare },
  ];

  // Add Admin item if user is admin
  if (user?.isAdmin) {
    navItems.push({ id: AppView.ADMIN, label: 'Admin Console', icon: Shield });
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center h-16 px-6 border-b border-slate-800">
          <Zap className="w-6 h-6 text-brand-400 mr-2" />
          <span className="text-xl font-bold tracking-tight">SEO Auditor<span className="text-brand-400">.ai</span></span>
          <button 
            className="ml-auto lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            // Highlight Admin differently
            const isSpecial = item.id === AppView.ADMIN;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors
                  ${isActive 
                    ? 'bg-brand-600 text-white' 
                    : isSpecial 
                      ? 'text-indigo-300 hover:text-white hover:bg-indigo-900/50' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }
                `}
              >
                <Icon className={`w-5 h-5 mr-3 ${isSpecial && !isActive ? 'text-indigo-400' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" 
                />
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="ml-2 text-slate-400 hover:text-white"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
             <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                AI
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Gemini Pro</p>
                <p className="text-xs text-slate-400">Powered by Google</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 lg:hidden">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="text-slate-500 hover:text-slate-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-semibold text-slate-900">SEO Auditor</span>
          <div className="w-6" /> {/* Spacer for centering */}
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
