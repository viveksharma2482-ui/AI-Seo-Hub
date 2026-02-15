import { GoogleGenAI, Type } from "@google/genai";
import { SiteAuditResult, ContentAnalysisResult } from "../types";

// Initialize Gemini Client
// IMPORTANT: Access API key from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

/**
 * Performs a simulated full site audit using Search Grounding and specific prompting.
 * Since we can't crawl directly from the browser, we rely on Gemini's search capabilities
 * and internal knowledge to assess the public facing version of the site.
 */
export const performSiteAudit = async (url: string): Promise<SiteAuditResult> => {
  const prompt = `
    Perform a comprehensive technical SEO audit for the website: ${url}.
    
    Use Google Search to identify:
    1. Indexed pages and their meta descriptions.
    2. Page load speed signals (Core Web Vitals info if available publicly).
    3. Mobile responsiveness signals.
    4. Common technical issues (SSL, redirect chains, robot.txt issues).

    If you cannot access specific real-time metrics, estimate based on best practices for the technology stack detected or general search appearance.

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
    // Fallback for demo purposes if API fails or quota exceeded
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
