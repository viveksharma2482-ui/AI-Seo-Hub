/**
 * Fetches real-time performance and SEO metrics from Google PageSpeed Insights API.
 * This bypasses CORS issues by using Google's API endpoint.
 */
export const getPageSpeedMetrics = async (url: string) => {
  // Ensure URL has protocol
  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }

  try {
    const apiKey = process.env.API_KEY;
    // We request categories: PERFORMANCE, SEO, ACCESSIBILITY, BEST_PRACTICES
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&category=BEST_PRACTICES&key=${apiKey}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      // If the specific API is not enabled on the key, we might get a 403, 
      // but we return null to allow the app to fallback to AI-only mode gracefully.
      console.warn('PageSpeed API Error:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Failed to fetch PageSpeed metrics, falling back to AI simulation", error);
    return null;
  }
};
