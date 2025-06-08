
/**
 * @fileOverview A Genkit tool to fetch recent news articles using NewsData.io.
 *
 * - fetchNewsArticleTool - The Genkit tool definition.
 * - FetchNewsArticleInput - Input schema for the tool.
 * - NewsArticleSchema - Output schema for a single news article from the tool.
 * - NewsArticle - TypeScript type for the NewsArticleSchema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const newsDataApiKey = process.env.NEWSDATA_API_KEY;

if (!newsDataApiKey) {
  console.warn(
    'NEWSDATA_API_KEY is not set in the environment variables. News fetching tool will not work.'
  );
}

export const FetchNewsArticleInputSchema = z.object({
  query: z.string().optional().describe("Keywords or a phrase to search for in news articles. Defaults to 'India current events' if not provided."),
  preferredDomains: z.array(z.string()).optional().describe("A list of preferred news source domains (e.g., 'thehindu.com', 'timesofindia.indiatimes.com'). If provided, the search will be limited to these domains. If omitted or empty, NewsData.io will search all its sources."),
});
export type FetchNewsArticleInput = z.infer<typeof FetchNewsArticleInputSchema>;

export const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  description: z.string().describe('A short description or snippet of the article content.'),
  url: z.string().url().describe('The URL to the full article (referred to as `link` by NewsData.io).'),
  publishedAt: z.string().describe('The publication date and time of the article (YYYY-MM-DD HH:MM:SS from NewsData.io `pubDate`, converted to ISO 8601 string for consistency).'),
  sourceName: z.string().describe('The name/ID of the news source (from NewsData.io `source_id`).'),
  content: z.string().optional().describe("The full content of the article, if available (from NewsData.io `content` or `description`). May be truncated by the API.")
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const fetchNewsArticleTool = ai.defineTool(
  {
    name: 'fetchNewsArticle',
    description: 'Fetches a single, recent news article using NewsData.io, based on a query and optional preferred domains. If no domains are preferred, searches all available sources. Prioritizes Indian sources like The Hindu or Times of India if specific hints leading to those domains are provided to the calling flow.',
    inputSchema: FetchNewsArticleInputSchema,
    outputSchema: NewsArticleSchema.nullable(),
  },
  async (input) => {
    if (!newsDataApiKey) {
      console.error('NewsData.io API key (NEWSDATA_API_KEY) is missing.');
      return null;
    }

    const params = new URLSearchParams({
      apikey: newsDataApiKey,
      q: input.query || 'India current events',
      language: 'en',
      // full_content: '1', // Request full content if available - NewsData.io param
      // prioritydomain: 'top', // Prioritize results from top domains - NewsData.io param
    });

    // NewsData.io uses 'domain' for sources like 'thehindu.com,timesofindia.indiatimes.com'
    if (input.preferredDomains && input.preferredDomains.length > 0) {
      params.append('domain', input.preferredDomains.join(','));
    }
    // If input.preferredDomains is not provided or empty, we simply don't append the 'domain' parameter,
    // allowing NewsData.io to search all its sources.


    const apiUrl = `https://newsdata.io/api/1/news?${params.toString()}`;

    try {
      // console.log("Attempting to fetch news from NewsData.io with URL:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`NewsData.io API error: ${response.status} ${response.statusText}`, errorData);
        if (response.status === 401 || response.status === 403) {
          console.error("NewsData.io API key might be invalid or have insufficient permissions.");
        }
        return null;
      }

      const data = await response.json();
      // console.log("NewsData.io raw response:", JSON.stringify(data, null, 2));

      if (data.status === 'success' && data.results && data.results.length > 0) {
        // Sort by pubDate descending to get the latest first, as NewsData.io might not sort by recency by default
        const sortedArticles = data.results.sort((a: any, b: any) => {
          return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
        });

        for (const article of sortedArticles) {
          // Basic validation of required fields
          if (article.title && (article.description || article.content) && article.link && article.pubDate && article.source_id) {
            const articleDateObj = new Date(article.pubDate.replace(' ', 'T') + 'Z'); // Convert YYYY-MM-DD HH:MM:SS to ISO parsable
            // console.log("Found suitable article from NewsData.io:", article.title, "Published:", article.pubDate);
            return {
              title: article.title,
              description: article.description || '',
              url: article.link, // map link to url
              publishedAt: articleDateObj.toISOString(), // map pubDate to publishedAt (ISO format)
              sourceName: article.source_id, // map source_id to sourceName
              content: article.content || article.description || '', // prefer content, fallback to description
            };
          }
        }
      }
      // console.log("No suitable article found from NewsData.io matching criteria.");
      return null;
    } catch (error: any) {
      console.error('Error fetching news from NewsData.io:', error.message, error.stack);
      return null;
    }
  }
);

