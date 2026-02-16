import { GoogleGenAI, Type } from "@google/genai";
import { SiteAuditResult, ContentAnalysisResult, CompetitorAnalysisResult } from "../types";
import { getPageSpeedMetrics } from "./pagespeed";

// Initialize Gemini Client
// IMPORTANT: Access API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Performs a site audit using real-time PageSpeed data + Gemini Search Grounding.
 */
export const performSiteAudit = async (url: string): Promise<SiteAuditResult> => {
  // 1. Fetch Real Data from Google PageSpeed Insights
  // This makes the app "functional" by getting actual server latencies, CLS, LCP, etc.
  const pageSpeedData = await getPageSpeedMetrics(url);

  // 2. Construct Prompt
  let prompt = `
    Perform a comprehensive technical SEO audit for the website: ${url}.
  `;

  if (pageSpeedData) {
    // If we have real data, feed it to the model
    const lighthouse = pageSpeedData.lighthouseResult;
    const metrics = {
      performance: lighthouse?.categories?.performance?.score * 100,
      seo: lighthouse?.categories?.seo?.score * 100,
      accessibility: lighthouse?.categories?.accessibility?.score * 100,
      bestPractices: lighthouse?.categories?.['best-practices']?.score * 100,
      audits: {
        lcp: lighthouse?.audits?.['largest-contentful-paint'],
        cls: lighthouse?.audits?.['cumulative-layout-shift'],
        ttfb: lighthouse?.audits?.['server-response-time'],
      }
    };

    prompt += `
      I have fetched REAL-TIME metrics from Google PageSpeed Insights. 
      Use this data as the absolute source of truth for scores and performance issues.
      
      Real Data:
      ${JSON.stringify(metrics, null, 2)}
      
      Analyze the specific audit failures in the data (like High LCP or CLS) and explain them in the 'issues' section.
    `;
  } else {
    prompt += `
      I could not fetch real-time PageSpeed data (API unavailable). 
      Please estimate scores based on a visual analysis using Google Search and general best practices for this type of site.
    `;
  }

  prompt += `
    Additionally, use Google Search to identify:
    1. Indexed pages and their meta descriptions (which PageSpeed doesn't show).
    2. Mobile responsiveness signals (if not in data).
    3. Common technical issues (SSL, redirect chains, robot.txt issues).

    Return the result strictly as a JSON object matching the schema provided.
    Ensure 'scores' are integers between 0 and 100.
    Classify 'issues' with severity 'critical', 'warning', or 'info'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "A brief executive summary of the audit." },
            scores: {
              type: Type.OBJECT,
              properties: {
                performance: { type: Type.INTEGER },
                accessibility: { type: Type.INTEGER },
                bestPractices: { type: Type.INTEGER },
                seo: { type: Type.INTEGER },
              },
              required: ["performance", "accessibility", "bestPractices", "seo"],
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  severity: { type: Type.STRING, enum: ["critical", "warning", "info"] },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ["severity", "title", "description", "recommendation"],
              },
            },
          },
          required: ["summary", "scores", "issues"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    
    return {
      url,
      timestamp: new Date().toISOString(),
      summary: data.summary,
      scores: data.scores,
      issues: data.issues.map((issue: any, index: number) => ({
        ...issue,
        id: `issue-${index}`,
      })),
    };

  } catch (error) {
    console.error("Audit failed:", error);
    throw error;
  }
};

/**
 * Analyzes specific text content for SEO optimization.
 */
export const analyzeContent = async (content: string, targetKeywords: string): Promise<ContentAnalysisResult> => {
  const prompt = `
    Analyze the following website content for SEO optimization focusing on these keywords: "${targetKeywords}".
    
    Content:
    """
    ${content.substring(0, 10000)}
    """
    
    Provide a JSON response with:
    1. An overall SEO score (0-100).
    2. A list of specific actionable suggestions to improve ranking.
    3. An improved version of the first paragraph or meta description snippet.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
            score: { type: Type.INTEGER },
            suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            improvedSnippet: { type: Type.STRING },
        }
      }
    },
  });

  const text = response.text;
    if (!text) throw new Error("No response from Gemini");

  return JSON.parse(text) as ContentAnalysisResult;
};

/**
 * Compares 3 websites for competitive analysis.
 */
export const performCompetitorAnalysis = async (urls: string[]): Promise<CompetitorAnalysisResult> => {
  // 1. Try to fetch metrics for all 3 sites
  const metricsPromises = urls.map(url => getPageSpeedMetrics(url));
  const pageSpeedResults = await Promise.all(metricsPromises);

  // 2. Build the context for Gemini
  let dataContext = "Here is the real-time PageSpeed data for the requested URLs (if available):\n";
  
  urls.forEach((url, index) => {
    const data = pageSpeedResults[index];
    if (data && data.lighthouseResult) {
       const scores = {
         performance: data.lighthouseResult.categories.performance.score * 100,
         seo: data.lighthouseResult.categories.seo.score * 100
       };
       dataContext += `URL: ${url} -> Performance: ${scores.performance}, SEO Score: ${scores.seo}\n`;
    } else {
       dataContext += `URL: ${url} -> Real-time metrics unavailable.\n`;
    }
  });

  const prompt = `
    Compare the following websites for SEO and Market Performance: ${urls.join(', ')}.
    
    ${dataContext}

    Use Google Search Grounding to ESTIMATE and retrieve the following for EACH website:
    1. Domain Authority (DA) - estimate based on reputation/search prominence (0-100 scale).
    2. Approximate Backlink Count (e.g., "1k+", "500", "1M+").
    3. Organic Keywords estimation (e.g., "High volume", "Niche specific").
    4. Top 3 Keywords they likely rank for.
    5. Key Strengths and Weaknesses.

    Also identify:
    - Market Gap: What are these competitors missing that a new player could exploit?
    - Strategic Recommendations: 3 specific things the first URL (${urls[0]}) should do to beat the others.

    Return the data strictly as JSON.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sites: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING },
                domainAuthority: { type: Type.INTEGER, description: "Estimated DA from 0-100" },
                backlinks: { type: Type.STRING, description: "Estimated count e.g. '1.5k'" },
                organicKeywords: { type: Type.STRING },
                performanceScore: { type: Type.INTEGER },
                seoScore: { type: Type.INTEGER },
                topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["url", "domainAuthority", "backlinks", "topKeywords", "strengths", "weaknesses"]
            }
          },
          marketGap: { type: Type.STRING },
          strategicRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["sites", "marketGap", "strategicRecommendations"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text) as CompetitorAnalysisResult;
};

/**
 * Chat with the SEO assistant.
 */
export const chatWithAssistant = async (history: { role: string, parts: { text: string }[] }[], newMessage: string) => {
    const chat = ai.chats.create({
        model: MODEL_NAME,
        history: history,
        config: {
            systemInstruction: "You are an expert SEO consultant. Help the user fix technical issues, write meta tags, and improve their website ranking. Be concise and actionable.",
        }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
};