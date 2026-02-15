import React, { useState } from 'react';
import { SiteAuditResult } from '../types';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, ExternalLink, Download, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { db } from '../services/db';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface DashboardProps {
  lastAudit: SiteAuditResult | null;
  onNewAudit: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ lastAudit, onNewAudit }) => {
  // If no lastAudit passed, try to get the latest from DB
  const displayAudit = lastAudit || db.getLatestAudit();
  const history = db.getAudits();
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllIssues, setShowAllIssues] = useState(false);

  if (!displayAudit) {
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

  const { scores, issues, url, timestamp } = displayAudit;

  const chartData = [
    { name: 'Performance', value: scores.performance, color: '#3b82f6' },
    { name: 'Accessibility', value: scores.accessibility, color: '#10b981' },
    { name: 'Best Practices', value: scores.bestPractices, color: '#f59e0b' },
    { name: 'SEO', value: scores.seo, color: '#8b5cf6' },
  ];

  const criticalIssues = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;

  const handleDownloadReport = async () => {
    const element = document.getElementById('audit-report-container');
    if (!element) return;
    
    setIsDownloading(true);
    // Ensure all details are visible before capture if needed, or we just capture what's there.
    // Ideally we would expand 'showAllIssues' temporarily but that causes a layout jump user sees.
    // For now, we rely on the user having the view they want, or we force it? 
    // Let's just capture the current view.
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const filename = `seo-report-${url.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6" id="audit-report-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Report</h1>
          <p className="text-slate-500 mt-1 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Generated for <span className="font-semibold mx-1">{url}</span> on {new Date(timestamp).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
            <button
              onClick={handleDownloadReport}
              disabled={isDownloading}
              className="flex items-center px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-70"
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button
              onClick={onNewAudit}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
            >
              Re-run Audit
            </button>
        </div>
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
            Score
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">AI Executive Summary</h3>
          <div className="prose prose-sm prose-slate max-w-none bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
            <p className="text-slate-600 leading-relaxed">{displayAudit.summary}</p>
          </div>
        </div>
      </div>

      {/* Detailed Issues List - Always visible for report, or toggleable */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div 
            className="p-6 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => setShowAllIssues(!showAllIssues)}
        >
            <div className="flex items-center">
                <FileText className="w-5 h-5 text-slate-500 mr-2" />
                <h3 className="text-lg font-semibold text-slate-900">Detailed Issue Breakdown</h3>
                <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                    {issues.length} Issues
                </span>
            </div>
            {showAllIssues ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
        
        {/* We keep this visible if downloading to capture it, or if toggled */}
        {(showAllIssues || isDownloading) && (
            <div className="divide-y divide-slate-100">
                {issues.map((issue, idx) => (
                    <div key={idx} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start">
                            <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full mr-4 ${
                                issue.severity === 'critical' ? 'bg-red-500' : 
                                issue.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                            }`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-semibold text-slate-900">{issue.title}</h4>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
                                        issue.severity === 'critical' ? 'bg-red-50 text-red-700' : 
                                        issue.severity === 'warning' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                                    }`}>
                                        {issue.severity}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{issue.description}</p>
                                <div className="bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-100">
                                    <span className="font-semibold text-slate-900">Recommendation: </span>
                                    {issue.recommendation}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:hidden">
           <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Audit History</h3>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-slate-200">
               <thead>
                 <tr>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Website</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Score</th>
                   <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issues</th>
                 </tr>
               </thead>
               <tbody className="bg-white divide-y divide-slate-200">
                 {history.slice(0, 5).map((audit, idx) => (
                   <tr key={idx} className="hover:bg-slate-50">
                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                        {audit.url}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(audit.timestamp).toLocaleDateString()}
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <span className="font-bold">{Math.round((audit.scores.performance + audit.scores.seo + audit.scores.accessibility + audit.scores.bestPractices) / 4)}</span>
                        <span className="text-slate-400">/100</span>
                     </td>
                     <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                       <span className="text-red-600 font-medium">{audit.issues.filter(i => i.severity === 'critical').length}</span> Critical
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};