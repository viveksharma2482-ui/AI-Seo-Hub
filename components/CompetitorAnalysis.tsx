import React, { useState } from 'react';
import { performCompetitorAnalysis } from '../services/gemini';
import { CompetitorAnalysisResult } from '../types';
import { Search, Loader2, ArrowRight, TrendingUp, Shield, Link, Zap, Target, Award } from 'lucide-react';
import { useNotification } from '../contexts/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export const CompetitorAnalysis: React.FC = () => {
  const [urls, setUrls] = useState<string[]>(['', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const { showNotification } = useNotification();

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    const validUrls = urls.filter(u => u.trim() !== '');
    
    if (validUrls.length < 2) {
      showNotification("Please enter at least 2 URLs to compare.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const data = await performCompetitorAnalysis(validUrls);
      setResult(data);
      showNotification("Comparison complete!", "success");
    } catch (err: any) {
      console.error(err);
      showNotification("Failed to analyze competitors. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = result?.sites.map(site => ({
    name: new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`).hostname.replace('www.', ''),
    DA: site.domainAuthority,
    Performance: site.performanceScore || 0,
    SEO: site.seoScore || 0
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Competitor Analysis</h1>
        <p className="text-slate-500 mb-6">Compare your website against up to 2 competitors to uncover content gaps, backlink opportunities, and performance differences.</p>
        
        <form onSubmit={handleAnalyze} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {urls.map((url, idx) => (
                <div key={idx} className="relative">
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                        {idx === 0 ? "Your Website" : `Competitor ${idx}`}
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => handleUrlChange(idx, e.target.value)}
                        placeholder="example.com"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm ${
                            idx === 0 ? 'border-brand-300 bg-brand-50' : 'border-slate-300'
                        }`}
                    />
                </div>
             ))}
          </div>
          
          <div className="flex justify-end">
            <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-lg shadow-sm hover:bg-slate-800 disabled:opacity-50 flex items-center"
            >
                {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing Market...
                </>
                ) : (
                <>
                    <Target className="w-4 h-4 mr-2" />
                    Compare Websites
                </>
                )}
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-6 animate-slide-in-down">
            {/* High Level Stats Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {result.sites.map((site, idx) => (
                    <div key={idx} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${idx === 0 ? 'border-brand-200 ring-4 ring-brand-50/50' : 'border-slate-200'}`}>
                        <div className={`p-4 border-b ${idx === 0 ? 'bg-brand-50 border-brand-100' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 truncate pr-2">
                                    {new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`).hostname}
                                </h3>
                                {idx === 0 && <span className="px-2 py-0.5 rounded text-xs font-bold bg-brand-200 text-brand-800">YOU</span>}
                            </div>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Shield className="w-3 h-3 mr-1" /> Domain Auth</p>
                                    <p className="text-xl font-bold text-slate-900">{site.domainAuthority}<span className="text-xs text-slate-400 font-normal">/100</span></p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Link className="w-3 h-3 mr-1" /> Backlinks</p>
                                    <p className="text-lg font-bold text-slate-900 truncate" title={site.backlinks}>{site.backlinks}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Zap className="w-3 h-3 mr-1" /> Performance</p>
                                    <p className={`text-xl font-bold ${
                                        site.performanceScore >= 90 ? 'text-green-600' : site.performanceScore >= 50 ? 'text-yellow-600' : 'text-slate-400'
                                    }`}>
                                        {site.performanceScore || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Search className="w-3 h-3 mr-1" /> SEO Score</p>
                                    <p className={`text-xl font-bold ${
                                        site.seoScore >= 90 ? 'text-green-600' : site.seoScore >= 50 ? 'text-yellow-600' : 'text-slate-400'
                                    }`}>
                                        {site.seoScore || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Top Keywords</p>
                                <div className="flex flex-wrap gap-2">
                                    {site.topKeywords.map((kw, k) => (
                                        <span key={k} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Visual Comparison Chart */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Metric Comparison</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="DA" name="Domain Authority" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Performance" name="Tech Performance" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="SEO" name="SEO Score" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Strategy & Recommendations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="flex items-center mb-4">
                        <Target className="w-6 h-6 text-indigo-600 mr-2" />
                        <h3 className="text-lg font-bold text-indigo-900">Strategic Market Gap</h3>
                    </div>
                    <p className="text-indigo-900 leading-relaxed text-sm">
                        {result.marketGap}
                    </p>
                 </div>

                 <div className="bg-gradient-to-br from-brand-50 to-white p-6 rounded-xl border border-brand-100 shadow-sm">
                    <div className="flex items-center mb-4">
                        <Award className="w-6 h-6 text-brand-600 mr-2" />
                        <h3 className="text-lg font-bold text-brand-900">Winning Strategy</h3>
                    </div>
                    <ul className="space-y-3">
                        {result.strategicRecommendations.map((rec, i) => (
                            <li key={i} className="flex items-start">
                                <span className="flex-shrink-0 w-5 h-5 bg-brand-200 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5">{i + 1}</span>
                                <span className="text-brand-900 text-sm">{rec}</span>
                            </li>
                        ))}
                    </ul>
                 </div>
            </div>
            
            {/* Detailed SWOT Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-900">SWOT Analysis Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">Website</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Strengths</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/3">Weaknesses</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {result.sites.map((site, idx) => (
                                <tr key={idx} className={idx === 0 ? 'bg-brand-50/30' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap align-top">
                                        <div className="font-medium text-slate-900">{new URL(site.url.startsWith('http') ? site.url : `https://${site.url}`).hostname}</div>
                                        {idx === 0 && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-brand-100 text-brand-800 mt-1">Primary</span>}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <ul className="space-y-1">
                                            {site.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-green-700 flex items-start">
                                                    <TrendingUp className="w-3 h-3 mr-1.5 mt-1 flex-shrink-0" />
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                        <ul className="space-y-1">
                                            {site.weaknesses.map((w, i) => (
                                                <li key={i} className="text-sm text-red-700 flex items-start">
                                                    <ArrowRight className="w-3 h-3 mr-1.5 mt-1 flex-shrink-0" />
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};