export interface SEOScore {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface SEOIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  recommendation: string;
}

export interface SiteAuditResult {
  url: string;
  timestamp: string;
  summary: string;
  scores: SEOScore;
  issues: SEOIssue[];
}

export interface ContentAnalysisResult {
  score: number;
  keywordDensity: Record<string, number>;
  suggestions: string[];
  improvedSnippet?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  AUDIT = 'AUDIT',
  CONTENT_OPTIMIZER = 'CONTENT_OPTIMIZER',
  ASSISTANT = 'ASSISTANT',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
