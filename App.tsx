import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { AuditView } from './components/AuditView';
import { ContentOptimizer } from './components/ContentOptimizer';
import { Assistant } from './components/Assistant';
import { AppView, SiteAuditResult, SEOIssue } from './types';

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [lastAudit, setLastAudit] = useState<SiteAuditResult | null>(null);
  const [assistantInitialMessage, setAssistantInitialMessage] = useState<string | undefined>(undefined);

  const handleAuditComplete = (result: SiteAuditResult) => {
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
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderContent()}
    </Layout>
  );
}

export default App;
