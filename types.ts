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
  type: 'audit'; // Discriminator
  id?: string;
  userId?: string;
  url: string;
  timestamp: string;
  summary: string;
  scores: SEOScore;
  issues: SEOIssue[];
}

export interface CompetitorMetric {
  label: string;
  value: string | number;
  unit?: string;
  isHighlight?: boolean; 
  winner?: boolean;
}

export interface SiteComparisonData {
  url: string;
  domainAuthority: number; // Estimated
  backlinks: string; // Estimated range like "1k-5k"
  organicKeywords: string;
  performanceScore: number;
  seoScore: number;
  topKeywords: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface CompetitorAnalysisResult {
  type: 'comparison'; // Discriminator
  id?: string;
  userId?: string;
  timestamp: string; // Added for history
  primaryUrl: string; // Added for reference
  sites: SiteComparisonData[];
  marketGap: string;
  strategicRecommendations: string[];
}

// Union type for all history items
export type HistoryItem = SiteAuditResult | CompetitorAnalysisResult;

export interface ContentAnalysisResult {
  score: number;
  keywordDensity: Record<string, number>;
  suggestions: string[];
  improvedSnippet?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  AUDIT = 'AUDIT',
  HISTORY = 'HISTORY',
  CONTENT_OPTIMIZER = 'CONTENT_OPTIMIZER',
  COMPETITOR_ANALYSIS = 'COMPETITOR_ANALYSIS',
  ASSISTANT = 'ASSISTANT',
  ADMIN = 'ADMIN',
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin?: boolean;
}