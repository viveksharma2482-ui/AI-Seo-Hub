import React, { useState } from 'react';
import { SiteAuditResult, SEOIssue } from '../types';
import { performSiteAudit } from '../services/gemini';
import { useNotification } from '../contexts/NotificationContext';
import { Search, Loader2, ChevronDown, ChevronUp, ExternalLink, Sparkles, Zap, Info } from 'lucide-react';

interface AuditViewProps {
  onAuditComplete: (result: SiteAuditResult) => void;
  lastAudit: SiteAuditResult | null;
  onFixIssue: (issue: SEOIssue) => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onAuditComplete, lastAudit, onFixIssue }) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [issueTab, setIssueTab] = useState<'details' | 'ai'>('details');
  const { showNotification } = useNotification();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    
    // Simulate progress steps for better UX
    setLoadingStep('Initializing PageSpeed API...');
    
    try {
      // We can't actually hook into the exact progress of the await, 
      // but we can set a timer to update the text to make it feel responsive
      const timer = setTimeout(() => {
        setLoadingStep('Fetching Core Web Vitals...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setLoadingStep('Gemini analyzing technical data...');
      }, 4000);

      const result = await performSiteAudit(url);
      
      clearTimeout(timer);
      clearTimeout(timer2);
      onAuditComplete(result);
      showNotification(`Audit for ${url} completed successfully!`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Failed to perform audit. Please check your API key and try again.', 'error');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const toggleIssue = (id: string) => {
    if (expandedIssue === id) {
        setExpandedIssue(null);
    } else {
        setExpandedIssue(id);
        setIssueTab('details'); // Reset to details when opening new issue
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">New Site Audit</h1>
        <p className="text-slate-500 mb-6">Enter a URL to generate a comprehensive technical SEO report using real-time PageSpeed data and AI analysis.</p>
        
        <form onSubmit={handleSubmit} className="relative max-w-2xl">
          <div className="flex shadow-sm rounded-lg">
            <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
              https://
            </span>
            <input
              type="text"
              value={url.replace('https://', '').replace('http://', '')}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com"
              className="flex-1 min-w-0 block w-full px-4 py-3 rounded-none rounded-r-lg border-slate-300 focus:ring-brand-500 focus:border-brand-500 sm:text-sm border"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !url}
            className="mt-4 w-full sm:w-auto px-6 py-3 bg-brand-600 text-white font-medium rounded-lg shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {loadingStep || 'Analyzing Site...'}
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Audit
              </>
            )}
          </button>
        </form>
      </div>

      {lastAudit && !isLoading && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-slate-900">Identified Issues</h2>
          
          <div className="space-y-4">
            {lastAudit.issues.map((issue) => (
              <div 
                key={issue.id} 
                className={`bg-white rounded-lg border shadow-sm transition-all overflow-hidden ${
                  issue.severity === 'critical' ? 'border-red-200' :
                  issue.severity === 'warning' ? 'border-yellow-200' : 'border-blue-200'
                }`}
              >
                <div 
                  className="p-4 flex items-start justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleIssue(issue.id)}
                >
                  <div className="flex items-start space-x-4">
                    <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                      issue.severity === 'critical' ? 'bg-red-500' :
                      issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{issue.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-1">{issue.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full uppercase mr-4 ${
                      issue.severity === 'critical' ? 'bg-red-50 text-red-700' :
                      issue.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {issue.severity}
                    </span>
                    {expandedIssue === issue.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {expandedIssue === issue.id && (
                  <div className="px-4 pb-4 pt-0">
                    {/* Internal Tabs */}
                    <div className="flex border-b border-slate-100 mb-4 mt-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIssueTab('details'); }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${
                                issueTab === 'details' 
                                ? 'border-brand-600 text-brand-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Info className="w-3 h-3 mr-2" />
                            Issue Details
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIssueTab('ai'); }}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${
                                issueTab === 'ai' 
                                ? 'border-indigo-500 text-indigo-600' 
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            <Sparkles className="w-3 h-3 mr-2" />
                            AI Recommendation
                        </button>
                    </div>

                    {issueTab === 'details' ? (
                        <div className="pl-4 pr-2 py-2">
                            <p className="text-sm text-slate-600 leading-relaxed">{issue.description}</p>
                            <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 border border-slate-100">
                                <strong>Technical Note:</strong> Verify this issue against your latest server logs or Google Search Console data for improved accuracy.
                            </div>
                        </div>
                    ) : (
                        <div className="pl-4 pr-2 py-2">
                            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 relative">
                                <div className="absolute top-4 right-4">
                                  <Zap className="w-4 h-4 text-indigo-400" />
                                </div>
                                <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wide mb-2 flex items-center">
                                  Gemini Analysis
                                </h4>
                                <p className="text-sm text-indigo-900 leading-relaxed mb-4">
                                  {issue.recommendation}
                                </p>
                                <div className="flex justify-end border-t border-indigo-100 pt-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onFixIssue(issue);
                                        }}
                                        className="inline-flex items-center text-xs font-medium text-indigo-700 hover:text-indigo-900 bg-white px-3 py-1.5 rounded shadow-sm border border-indigo-200 transition-colors"
                                    >
                                        Ask AI Assistant to fix this
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};