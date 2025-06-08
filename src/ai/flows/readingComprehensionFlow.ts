
'use server';
/**
 * @fileOverview A Genkit flow to fetch a short news article using a tool and generate comprehension questions.
 *
 * - getNewsAndQuestions - Fetches a news summary and questions.
 * - GetNewsAndQuestionsInput - Input type { sourceHint: string (optional) }.
 * - GetNewsAndQuestionsOutput - Output type: { article: string, articleDate: string, questions: string[], articleUrl?: string, articleSource?: string }.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { fetchNewsArticleTool, NewsArticleSchema, type NewsArticle } from '@/ai/tools/newsTool';

const GetNewsAndQuestionsInputSchema = z.object({
  sourceHint: z.string().optional().describe("Optional hint for the news source, e.g., 'The Hindu' or 'Times of India'. This will be used to prefer domains in the news fetching tool like 'thehindu.com' or 'timesofindia.indiatimes.com'."),
});
export type GetNewsAndQuestionsInput = z.infer<typeof GetNewsAndQuestionsInputSchema>;

const GetNewsAndQuestionsOutputSchema = z.object({
  article: z.string().describe('A summarized news article in English, approximately 100-200 words long. If no article can be found or summarized, this field should state that.'),
  articleDate: z.string().describe('The publication date of the news article (e.g., "YYYY-MM-DD"). If no article is found, this can be "N/A".'),
  questions: z.array(z.string()).min(1).max(2).describe('An array of 1 to 2 comprehension questions based on the article. If no article, this might contain a general follow-up question.'),
  articleUrl: z.string().url().optional().describe("The URL of the original news article, if available."),
  articleSource: z.string().optional().describe("The source ID/name of the news article (e.g., 'thehindu', 'timesofindia'), if available."),
});
export type GetNewsAndQuestionsOutput = z.infer<typeof GetNewsAndQuestionsOutputSchema>;

const newsPrompt = ai.definePrompt({
  name: 'newsComprehensionPromptWithTool',
  input: { schema: z.object({ toolOutput: NewsArticleSchema.nullable(), originalInput: GetNewsAndQuestionsInputSchema }) },
  output: { schema: GetNewsAndQuestionsOutputSchema },
  prompt: `
You have been provided with structured data for a news article fetched by a dedicated news tool (NewsData.io).
Your goal is to prepare this article for a reading comprehension exercise.

News Article Data:
{{#if toolOutput}}
  Title: {{{toolOutput.title}}}
  Source ID: {{{toolOutput.sourceName}}}
  Published At (ISO 8601): {{{toolOutput.publishedAt}}}
  URL: {{{toolOutput.url}}}
  Description Snippet: {{{toolOutput.description}}}
  Full Content (may be truncated by API): {{{toolOutput.content}}}
{{else}}
  The news fetching tool did not find a suitable article using NewsData.io.
{{/if}}

Your tasks are:
1.  **Process Article Data (if available):**
    {{#if toolOutput}}
    a.  Using the 'Full Content' (if substantial) or the 'Description Snippet' from the tool's output, create a concise summary of the news article. This summary MUST be in English and be between 100 and 200 words. This will be the 'article' field in your JSON output.
    b.  The 'articleDate' field in your JSON output MUST be extracted from the 'Published At' date from the tool output. 'Published At' is in ISO 8601 format (e.g., "2024-07-15T10:30:00.000Z"); format 'articleDate' as "YYYY-MM-DD" (e.g., "2024-07-15").
    c.  The 'articleUrl' field should be the 'URL' from the tool output.
    d.  The 'articleSource' field should be the 'Source ID' (sourceName) from the tool output.
    e.  Based *only* on the summary you created, generate 1 or 2 clear comprehension questions. These questions should test understanding of the main points of your summary.
    {{else}}
    a.  Since no article was found by the tool, set the 'article' field in your JSON output to a polite message stating that an article could not be fetched (e.g., "I was unable to retrieve a news article at this time using NewsData.io. The service might be temporarily unavailable or no recent articles matched the criteria. Please try again later.").
    b.  Set 'articleDate' to "N/A".
    c.  Set 'articleUrl' and 'articleSource' to undefined or null.
    d.  Set 'questions' to an array containing a single, general follow-up question, such as "Would you like me to try fetching news again?".
    {{/if}}

2.  **Output Format:** Ensure your entire response is a single JSON object matching the GetNewsAndQuestionsOutputSchema.

Focus on using the provided text ('Full Content' or 'Description Snippet') for summarization. Do not invent details.
CRITICAL: Ensure the article summarization and questions are based *only* on the provided 'toolOutput'.
`,
});

const getNewsAndQuestionsFlow = ai.defineFlow(
  {
    name: 'getNewsAndQuestionsFlow',
    inputSchema: GetNewsAndQuestionsInputSchema,
    outputSchema: GetNewsAndQuestionsOutputSchema,
  },
  async (flowInput: GetNewsAndQuestionsInput): Promise<GetNewsAndQuestionsOutput> => {
    const preferredDomains: string[] = [];
    let query = 'India current events'; 

    if (flowInput.sourceHint) {
      const hintLower = flowInput.sourceHint.toLowerCase();
      if (hintLower.includes('hindu')) preferredDomains.push('thehindu.com');
      if (hintLower.includes('times of india')) preferredDomains.push('timesofindia.indiatimes.com');
      if (hintLower.includes('ndtv')) preferredDomains.push('ndtv.com');
      if (hintLower.includes('india today')) preferredDomains.push('indiatoday.in');
    }

    const articleData = await fetchNewsArticleTool({
      query: query,
      preferredDomains: preferredDomains.length > 0 ? preferredDomains : undefined,
    });

    const { output } = await newsPrompt({ toolOutput: articleData, originalInput: flowInput });

    if (!output) {
      console.error('Failed to generate news and questions after processing tool output.');
      return {
        article: "I encountered an issue while trying to prepare the news article. Please try again.",
        articleDate: "N/A",
        questions: ["Would you like to try fetching news again?"],
        articleUrl: undefined,
        articleSource: undefined,
      };
    }

    if (!output.questions || output.questions.length === 0) {
      return {
        article: output.article || "I couldn't fetch an article right now. Please try again later.",
        articleDate: output.articleDate || "N/A",
        questions: ["What would you like to do next?"], // Fallback question
        articleUrl: output.articleUrl,
        articleSource: output.articleSource,
      };
    }
    return output;
  }
);

export async function getNewsAndQuestions(input: GetNewsAndQuestionsInput): Promise<GetNewsAndQuestionsOutput> {
  return getNewsAndQuestionsFlow(input);
}
