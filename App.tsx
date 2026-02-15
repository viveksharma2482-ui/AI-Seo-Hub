import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuditView } from './components/AuditView';
import { ContentOptimizer } from './components/ContentOptimizer';
import { Assistant } from './components/Assistant';
import { AdminDashboard } from './components/AdminDashboard';
import { Login } from './components/Login';
import { AppView, SiteAuditResult, SEOIssue } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './services/db';

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [lastAudit, setLastAudit] = useState<SiteAuditResult | null>(null);
  const [assistantInitialMessage, setAssistantInitialMessage] = useState<string | undefined>(undefined);

  // If auth is loading, we could show a spinner, but simplest to wait
  if (isLoading) return null;

  // If not authenticated, show Login
  if (!user) {
    return <Login />;
  }

  const handleAuditComplete = (result: SiteAuditResult) => {
    // Save to local database
    db.saveAudit(result);
    setLastAudit(result);
    setCurrentView(AppView.DASHBOARD);
  };

  const handleFixIssue = (issue: SEOIssue) => {
    const prompt = `I need help fixing this SEO issue on my website:\n\n**Issue:** ${issue.title}\n**Description:** ${issue.description}\n**Current Recommendation:** ${issue.recommendation}\n\nCan you provide a code snippet or step-by-step guide to resolve this?`;
    setAssistantInitialMessage(prompt);
    setCurrentView(AppView.ASSISTANT);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            lastAudit={lastAudit} 
            onNewAudit={() => setCurrentView(AppView.AUDIT)} 
          />
        );
      case AppView.AUDIT:
        return (
          <AuditView 
            onAuditComplete={handleAuditComplete} 
            lastAudit={lastAudit}
            onFixIssue={handleFixIssue}
          />
        );
      case AppView.CONTENT_OPTIMIZER:
        return <ContentOptimizer />;
      case AppView.ASSISTANT:
        return <Assistant initialMessage={assistantInitialMessage} />;
      case AppView.ADMIN:
        if (!user.isAdmin) {
            // Fallback for unauthorized access
            return <Dashboard lastAudit={lastAudit} onNewAudit={() => setCurrentView(AppView.AUDIT)} />;
        }
        return <AdminDashboard />;
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
