
'use server';
/**
 * @fileOverview A Genkit tool to fetch recent news articles using NewsAPI.org.
 *
 * - fetchNewsArticleTool - The Genkit tool definition.
 * - FetchNewsArticleInput - Input schema for the tool.
 * - NewsArticle - Output schema for a single news article.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import NewsAPI from 'newsapi';

// Ensure you have NEWS_API_KEY in your .env file
const newsApiKey = process.env.NEWS_API_KEY;

if (!newsApiKey) {
  console.warn(
    'NEWS_API_KEY is not set in the environment variables. News fetching tool will not work.'
  );
}
// Initialize NewsAPI client. It will be null if the API key is missing.
const newsapi = newsApiKey ? new NewsAPI(newsApiKey) : null;

const FetchNewsArticleInputSchema = z.object({
  query: z.string().optional().describe("Keywords or a phrase to search for in news articles. Defaults to 'India current events' if not provided."),
  preferredSources: z.array(z.string()).optional().describe("A list of preferred news source IDs (e.g., 'the-hindu', 'the-times-of-india'). The tool will try to fetch from these first."),
});
export type FetchNewsArticleInput = z.infer<typeof FetchNewsArticleInputSchema>;

export const NewsArticleSchema = z.object({
  title: z.string().describe('The title of the news article.'),
  description: z.string().describe('A short description or snippet of the article content.'),
  url: z.string().url().describe('The URL to the full article.'),
  publishedAt: z.string().describe('The publication date and time of the article in ISO 8601 format.'),
  sourceName: z.string().describe('The name of the news source.'),
  content: z.string().optional().describe("The full content of the article, if available. May be truncated by the API, often up to 200-260 characters.")
});
export type NewsArticle = z.infer<typeof NewsArticleSchema>;

export const fetchNewsArticleTool = ai.defineTool(
  {
    name: 'fetchNewsArticle',
    description: 'Fetches a single, very recent news article (from today or yesterday) based on a query and preferred sources. Prioritizes Indian sources like The Hindu or Times of India if no specific preference is given.',
    inputSchema: FetchNewsArticleInputSchema,
    outputSchema: NewsArticleSchema.nullable(), // Can return null if no article is found
  },
  async (input) => {
    if (!newsapi) {
      console.error('NewsAPI client is not initialized because NEWS_API_KEY is missing.');
      return null;
    }

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0]; // YYYY-MM-DD

    // Default sources if none are preferred. These are valid IDs for NewsAPI.org.
    let sourcesToUse = ['the-times-of-india', 'the-hindu', 'google-news-in'];
    if (input.preferredSources && input.preferredSources.length > 0) {
      sourcesToUse = input.preferredSources;
    }

    const queryParameters: NewsAPI.EverythingRequest = {
      q: input.query || 'India current events',
      sources: sourcesToUse.join(','), // NewsAPI expects source IDs here
      language: 'en',
      sortBy: 'publishedAt', // Get the latest first
      from: formatDate(yesterday),
      to: formatDate(today),
      pageSize: 5, // Fetch a few articles to increase chances of finding a good one
    };

    try {
      // console.log("Attempting to fetch news with parameters:", queryParameters);
      const response = await newsapi.v2.everything(queryParameters);
      // console.log("NewsAPI raw response:", JSON.stringify(response, null, 2));

      if (response.status === 'ok' && response.articles && response.articles.length > 0) {
        for (const article of response.articles) {
          if (article.title && (article.description || article.content) && article.url && article.publishedAt && article.source?.name) {
            // Additional check for date, as NewsAPI 'from' and 'to' can sometimes be inclusive of the start of 'from' day and end of 'to' day.
            const articleDate = new Date(article.publishedAt);
             // Ensure article date is within the last 48 hours (approx) leading up to the end of "today"
            const searchStartDate = new Date(formatDate(yesterday) + "T00:00:00.000Z"); // Start of yesterday
            const searchEndDate = new Date(formatDate(today) + "T23:59:59.999Z");     // End of today

            if (articleDate >= searchStartDate && articleDate <= searchEndDate) {
              // console.log("Found suitable article:", article.title, "Published:", article.publishedAt);
              return {
                title: article.title,
                description: article.description || '', // Ensure description is always a string
                url: article.url,
                publishedAt: article.publishedAt,
                sourceName: article.source.name,
                content: article.content || article.description || '', // Provide content, fallback to description
              };
            }
            // else {
            //   console.log("Article skipped due to date mismatch:", article.title, "Published:", article.publishedAt);
            // }
          }
        }
      }
      // console.log("No suitable article found from NewsAPI matching criteria.");
      return null;
    } catch (error: any) {
      console.error('Error fetching news from NewsAPI:', error.message, error.stack);
      if (error.message && error.message.includes('apiKeyMissing')) {
         console.error("NewsAPI key is missing or invalid.");
      }
      return null;
    }
  }
);
