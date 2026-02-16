import React, { useState, useEffect } from 'react';
import { HistoryItem, SiteAuditResult, CompetitorAnalysisResult } from '../types';
import { db } from '../services/db';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Search, ArrowRight, TrendingUp, Filter, Globe, Swords } from 'lucide-react';

interface HistoryViewProps {
  onSelectAudit: (item: HistoryItem) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onSelectAudit }) => {
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user) {
      // Get all history (audits + comparisons) for this user
      const userHistory = db.getAudits(user.id);
      setHistoryItems(userHistory);
    }
  }, [user]);

  const getUrlFromItem = (item: HistoryItem) => {
    if (item.type === 'comparison') {
        return item.primaryUrl + ' (vs others)';
    }
    return item.url;
  };

  const filteredItems = historyItems.filter(item => 
    getUrlFromItem(item).toLowerCase().includes(filter.toLowerCase()) || 
    new Date(item.timestamp).toLocaleDateString().includes(filter)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit History</h1>
          <p className="text-slate-500 mt-1">View and manage your past website audits and competitor analysis reports.</p>
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
             {filteredItems.length} Records
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No History Found</h3>
            <p className="text-slate-500 mt-2">
              {filter ? "No records match your filter." : "You haven't performed any audits or comparisons yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Website(s)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Snapshot</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredItems.map((item, idx) => {
                  const isComparison = item.type === 'comparison';
                  
                  return (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isComparison ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                <Swords className="w-3 h-3 mr-1" /> Comparison
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <Globe className="w-3 h-3 mr-1" /> Site Audit
                            </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-slate-900">
                            {isComparison ? (item as CompetitorAnalysisResult).primaryUrl : (item as SiteAuditResult).url}
                        </span>
                        {isComparison && <span className="text-xs text-slate-400 block ml-0.5">vs {(item as CompetitorAnalysisResult).sites.length - 1} competitors</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                         {new Date(item.timestamp).toLocaleDateString()}
                         <span className="text-xs text-slate-400 block">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isComparison ? (
                            <div className="flex flex-col text-xs text-slate-500">
                                <span>Gap: {(item as CompetitorAnalysisResult).marketGap.substring(0, 30)}...</span>
                            </div>
                        ) : (
                            (() => {
                                const audit = item as SiteAuditResult;
                                const avgScore = Math.round(
                                    (audit.scores.performance + audit.scores.seo + audit.scores.accessibility + audit.scores.bestPractices) / 4
                                );
                                return (
                                    <div className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-2 ${
                                            avgScore >= 90 ? 'bg-green-100 text-green-700' :
                                            avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {avgScore}
                                        </div>
                                        <span className="text-sm text-slate-500">Avg Score</span>
                                    </div>
                                );
                            })()
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onSelectAudit(item)}
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