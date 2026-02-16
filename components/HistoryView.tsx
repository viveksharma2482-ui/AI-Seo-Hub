import React, { useState, useEffect } from 'react';
import { SiteAuditResult } from '../types';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Search, ArrowRight, TrendingUp, Filter, Globe } from 'lucide-react';

interface HistoryViewProps {
  onSelectAudit: (audit: SiteAuditResult) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAudit }) => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<SiteAuditResult[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user) {
      // Get audits specifically for this user
      const userAudits = db.getAudits(user.id);
      setAudits(userAudits);
    }
  }, [user]);

  const filteredAudits = audits.filter(a => 
    a.url.toLowerCase().includes(filter.toLowerCase()) || 
    new Date(a.timestamp).toLocaleDateString().includes(filter)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit History</h1>
          <p className="text-slate-500 mt-1">View and manage your past website audits.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by URL or date..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div className="flex items-center text-sm text-slate-500">
             <Filter className="w-4 h-4 mr-2" />
             {filteredAudits.length} Records
          </div>
        </div>

        {filteredAudits.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Audits Found</h3>
            <p className="text-slate-500 mt-2">
              {filter ? "No audits match your filter." : "You haven't performed any audits yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Overall Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Issues</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAudits.map((audit, idx) => {
                  const avgScore = Math.round(
                    (audit.scores.performance + audit.scores.seo + audit.scores.accessibility + audit.scores.bestPractices) / 4
                  );
                  const criticalCount = audit.issues.filter(i => i.severity === 'critical').length;
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-8 h-8 bg-brand-50 rounded flex items-center justify-center text-brand-600">
                             <Globe className="w-4 h-4" />
                          </div>
                          <span className="ml-3 text-sm font-medium text-slate-900">{audit.url}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {new Date(audit.timestamp).toLocaleDateString()}
                         <span className="text-xs text-slate-400 block">{new Date(audit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                            avgScore >= 90 ? 'bg-green-100 text-green-700' :
                            avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {avgScore}
                          </div>
                          <span className="text-sm text-slate-500">/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {criticalCount > 0 ? (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                             {criticalCount} Critical
                           </span>
                        ) : (
                           <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                             Passed
                           </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onSelectAudit(audit)}
                          className="text-brand-600 hover:text-brand-900 flex items-center justify-end w-full"
                        >
                          View Report <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};