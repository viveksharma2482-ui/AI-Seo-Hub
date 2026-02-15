import React from 'react';
import { SiteAuditResult } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  lastAudit: SiteAuditResult | null;
  onNewAudit: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ lastAudit, onNewAudit }) => {
  if (!lastAudit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
        <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-4">
          <TrendingUp className="w-12 h-12 text-brand-500" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900">No Audits Yet</h2>
        <p className="text-slate-500 max-w-md">
          Start your first site audit to get comprehensive insights about your SEO performance, accessibility, and more.
        </p>
        <button
          onClick={onNewAudit}
          className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200"
        >
          Start New Audit
        </button>
      </div>
    );
  }

  const { scores, issues, url, timestamp } = lastAudit;

  const chartData = [
    { name: 'Performance', value: scores.performance, color: '#3b82f6' },
    { name: 'Accessibility', value: scores.accessibility, color: '#10b981' },
    { name: 'Best Practices', value: scores.bestPractices, color: '#f59e0b' },
    { name: 'SEO', value: scores.seo, color: '#8b5cf6' },
  ];

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Last audit for <span className="font-semibold mx-1">{url}</span> on {new Date(timestamp).toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={onNewAudit}
          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
        >
          Re-run Audit
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Overall Health</h3>
            <TrendingUp className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {Math.round((scores.performance + scores.seo + scores.accessibility + scores.bestPractices) / 4)}%
          </div>
          <div className="mt-2 text-sm text-green-600 font-medium">
            Good condition
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Critical Errors</h3>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{criticalIssues}</div>
          <div className="mt-2 text-sm text-red-600 font-medium">
            Requires attention
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Warnings</h3>
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{warnings}</div>
          <div className="mt-2 text-sm text-yellow-600 font-medium">
            Improvement needed
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-500 font-medium">Passed Checks</h3>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">
            {issues.filter(i => i.severity === 'info').length + 12} 
          </div>
          <div className="mt-2 text-sm text-slate-500">
            Estimated passed
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Score Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Summary</h3>
          <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100">
            <p className="text-slate-600 leading-relaxed">{lastAudit.summary}</p>
          </div>
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-900 mb-2">Top Priorities</h4>
            <ul className="space-y-2">
              {issues.slice(0, 3).map((issue, idx) => (
                <li key={idx} className="flex items-start text-sm text-slate-600">
                  <span className={`w-2 h-2 mt-1.5 rounded-full mr-2 flex-shrink-0 ${
                    issue.severity === 'critical' ? 'bg-red-500' : 
                    issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  {issue.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
