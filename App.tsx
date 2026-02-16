import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuditView } from './components/AuditView';
import { ContentOptimizer } from './components/ContentOptimizer';
import { Assistant } from './components/Assistant';
import { AdminDashboard } from './components/AdminDashboard';
import { HistoryView } from './components/HistoryView';
import { CompetitorAnalysis } from './components/CompetitorAnalysis';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { AppView, SiteAuditResult, SEOIssue, CompetitorAnalysisResult, HistoryItem } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { db } from './services/db';

const AppContent = () => {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  
  // State for different view data
  const [lastAudit, setLastAudit] = useState<SiteAuditResult | null>(null);
  const [lastComparison, setLastComparison] = useState<CompetitorAnalysisResult | null>(null);
  const [assistantInitialMessage, setAssistantInitialMessage] = useState<string | undefined>(undefined);

  // If auth is loading, we could show a spinner, but simplest to wait
  if (isLoading) return null;

  // If not authenticated, show Login
  if (!user) {
    return <Login />;
  }

  // Handle saving new audit
  const handleAuditComplete = (result: SiteAuditResult) => {
    // Save to local database with userId and type
    const auditWithUser: SiteAuditResult = { ...result, userId: user.id, type: 'audit' };
    db.saveAudit(auditWithUser);
    setLastAudit(auditWithUser);
    setCurrentView(AppView.DASHBOARD);
  };

  // Handle saving new comparison
  const handleComparisonComplete = (result: CompetitorAnalysisResult) => {
    // userId is already added in component if needed, but lets ensure consistency
    const comparisonWithUser: CompetitorAnalysisResult = { ...result, userId: user.id, type: 'comparison' };
    db.saveAudit(comparisonWithUser);
    setLastComparison(comparisonWithUser);
    // Stay on view or redirect? Usually stay to see result.
  };

  const handleFixIssue = (issue: SEOIssue) => {
    const prompt = `I need help fixing this SEO issue on my website:\n\n**Issue:** ${issue.title}\n**Description:** ${issue.description}\n**Current Recommendation:** ${issue.recommendation}\n\nCan you provide a code snippet or step-by-step guide to resolve this?`;
    setAssistantInitialMessage(prompt);
    setCurrentView(AppView.ASSISTANT);
  };

  // Handle selecting any item from history
  const handleSelectHistoryItem = (item: HistoryItem) => {
    if (item.type === 'comparison') {
        setLastComparison(item as CompetitorAnalysisResult);
        setCurrentView(AppView.COMPETITOR_ANALYSIS);
    } else {
        // Default to audit
        setLastAudit(item as SiteAuditResult);
        setCurrentView(AppView.DASHBOARD);
    }
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
      case AppView.HISTORY:
        return (
          <HistoryView 
            onSelectAudit={handleSelectHistoryItem} 
          />
        );
      case AppView.COMPETITOR_ANALYSIS:
        return (
            <CompetitorAnalysis 
                onAnalysisComplete={handleComparisonComplete}
                initialResult={lastComparison}
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
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
        <Toast />
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;