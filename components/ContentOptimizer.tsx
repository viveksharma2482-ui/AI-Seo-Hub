import React, { useState } from 'react';
import { analyzeContent } from '../services/gemini';
import { ContentAnalysisResult } from '../types';
import { Loader2, Wand2, Check, FileText } from 'lucide-react';

export const ContentOptimizer: React.FC = () => {
  const [content, setContent] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ContentAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!content || !keywords) return;
    setIsAnalyzing(true);
    try {
      const data = await analyzeContent(content, keywords);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-8rem)]">
      <div className="flex flex-col space-y-4 h-full">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Content Input</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">Target Keywords</label>
            <input 
              type="text" 
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., best running shoes, marathon training"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm"
            />
          </div>

          <div className="flex-1">
             <label className="block text-sm font-medium text-slate-700 mb-1">Content</label>
             <textarea
               value={content}
               onChange={(e) => setContent(e.target.value)}
               placeholder="Paste your blog post, article, or page content here..."
               className="w-full h-full p-4 border border-slate-300 rounded-lg focus:ring-brand-500 focus:border-brand-500 text-sm resize-none font-mono"
               style={{ minHeight: '300px' }}
             />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !content || !keywords}
            className="mt-4 w-full px-6 py-3 bg-brand-600 text-white font-medium rounded-lg shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Analyze Content
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col h-full overflow-hidden">
        {result ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-slate-900">Analysis Result</h2>
              <div className="flex items-center">
                <span className="text-sm text-slate-500 mr-2">SEO Score</span>
                <span className={`text-2xl font-bold ${
                  result.score >= 80 ? 'text-green-600' :
                  result.score >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {result.score}/100
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Suggestions</h3>
                <div className="space-y-3">
                  {result.suggestions.map((suggestion, idx) => (
                    <div key={idx} className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <Wand2 className="w-4 h-4 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-slate-700">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {result.improvedSnippet && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Improved Snippet</h3>
                  <div className="p-4 bg-brand-50 border border-brand-100 rounded-lg">
                    <p className="text-sm text-slate-800 italic">"{result.improvedSnippet}"</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <FileText className="w-16 h-16 mb-4 opacity-50" />
            <p className="font-medium">Ready to optimize</p>
            <p className="text-sm mt-2 max-w-xs">Enter your content and target keywords to get AI-powered improvement suggestions.</p>
          </div>
        )}
      </div>
    </div>
  );
};