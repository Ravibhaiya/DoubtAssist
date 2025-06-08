
'use server';
/**
 * @fileOverview A Genkit flow to fetch a short news article and generate comprehension questions.
 *
 * - getNewsAndQuestions - Fetches a news summary and questions.
 * - GetNewsAndQuestionsInput - Input type (currently empty).
 * - GetNewsAndQuestionsOutput - Output type: { article: string, articleDate: string, questions: string[] }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetNewsAndQuestionsInputSchema = z.object({
  sourceHint: z.string().optional().describe("Optional hint for the news source, e.g., 'The Hindu' or 'Times of India'"),
});
export type GetNewsAndQuestionsInput = z.infer<typeof GetNewsAndQuestionsInputSchema>;

const GetNewsAndQuestionsOutputSchema = z.object({
  article: z.string().describe('A summarized news article in English, approximately 100-200 words long. If no article meeting the date criteria can be found, this field should state that.'),
  articleDate: z.string().describe('The publication date of the news article (e.g., "YYYY-MM-DD" or "Month DD, YYYY"). If no article is found, this can be "N/A".'),
  questions: z.array(z.string()).min(1).max(2).describe('An array of 1 to 2 comprehension questions based on the article. If no article, this might contain a general follow-up question.'),
});
export type GetNewsAndQuestionsOutput = z.infer<typeof GetNewsAndQuestionsOutputSchema>;

const newsPrompt = ai.definePrompt({
  name: 'newsComprehensionPrompt',
  input: {schema: GetNewsAndQuestionsInputSchema},
  output: {schema: GetNewsAndQuestionsOutputSchema},
  prompt: `You are an AI assistant helping a user with reading comprehension.
Your task is to provide a news article summary about **current events**, its publication date, and then ask comprehension questions about it.

**CRITICAL DATE REQUIREMENT:**
1. The news article summary MUST be about events that occurred on **today** (the exact current calendar date of this request) or, if no suitable article detailing events from today is found, from **yesterday** (the calendar day immediately preceding today).
2. **DO NOT provide articles older than yesterday.** For example, if the current date is June 9, 2025, you must provide an article from June 9, 2025, or June 8, 2025.
3. **If you absolutely cannot find a relevant article from today or yesterday from any reputable source, you MUST explicitly state in the 'article' field that you were unable to find an article meeting the strict date criteria, instead of providing an older article.** In this case, set 'articleDate' to "N/A".

Further Instructions:
4. The article should ideally be from a reputable Indian English newspaper (like The Hindu or Times of India if possible, but prioritize recency from any reputable source if a specific Indian source doesn't have an article matching the strict date criteria).
5. Aim to provide a different article than one you might have provided recently, covering diverse topics if possible while adhering to the date constraint.
6. The article summary must be in English and be between 100 and 200 words.
7. Determine and provide the **publication date** of the article. Format it clearly (e.g., "YYYY-MM-DD" or "Month DD, YYYY"). This date MUST match the "today" or "yesterday" requirement, unless you are stating that no such article was found.
8. After providing the article and its date (or stating inability to find one), generate 1 or 2 clear comprehension questions. If no article was found, the questions can be more general, like "Would you like me to try searching for news on a different topic or from a broader timeframe?"
{{#if sourceHint}}
Consider news related to topics typically covered by {{sourceHint}}, but only if it meets the strict date criteria.
{{/if}}
Ensure your output is in the specified JSON format, including the articleDate matching the critical date requirement (or "N/A" if no suitable article found).
`,
});

const getNewsAndQuestionsFlow = ai.defineFlow(
  {
    name: 'getNewsAndQuestionsFlow',
    inputSchema: GetNewsAndQuestionsInputSchema,
    outputSchema: GetNewsAndQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await newsPrompt(input);
    if (!output) {
      throw new Error('Failed to generate news and questions.');
    }
    // Ensure there's at least one question, even if LLM fails to provide an array or an article
    if (!output.questions || output.questions.length === 0) {
      return {
        article: output.article || "I couldn't fetch an article right now. Please try again later.",
        articleDate: output.articleDate || "Date not available",
        questions: ["What would you like to do next?"], // More generic fallback
      }
    }
    return output;
  }
);

export async function getNewsAndQuestions(input: GetNewsAndQuestionsInput): Promise<GetNewsAndQuestionsOutput> {
  return getNewsAndQuestionsFlow(input);
}
