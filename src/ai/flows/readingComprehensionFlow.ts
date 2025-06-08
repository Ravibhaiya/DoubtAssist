
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
  article: z.string().describe('A summarized news article in English, approximately 100-200 words long.'),
  articleDate: z.string().describe('The publication date of the news article, e.g., "YYYY-MM-DD" or "Month DD, YYYY".'),
  questions: z.array(z.string()).min(1).max(2).describe('An array of 1 to 2 comprehension questions based on the article.'),
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

Further Instructions:
3. The article should ideally be from a reputable Indian English newspaper (like The Hindu or Times of India if possible, but prioritize recency from any reputable source if a specific Indian source doesn't have an article matching the strict date criteria).
4. Aim to provide a different article than one you might have provided recently, covering diverse topics if possible while adhering to the date constraint.
5. The article summary must be in English and be between 100 and 200 words.
6. Determine and provide the **publication date** of the article. Format it clearly (e.g., "YYYY-MM-DD" or "Month DD, YYYY"). This date MUST match the "today" or "yesterday" requirement.
7. After providing the article and its date, generate 1 or 2 clear comprehension questions that can be answered based *only* on the information present in the summarized article.
{{#if sourceHint}}
Consider news related to topics typically covered by {{sourceHint}}, but only if it meets the strict date criteria.
{{/if}}
Ensure your output is in the specified JSON format, including the articleDate matching the critical date requirement.
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
    // Ensure there's at least one question, even if LLM fails to provide an array
    if (!output.questions || output.questions.length === 0) {
      return {
        article: output.article || "I couldn't fetch an article right now. Please try again later.",
        articleDate: output.articleDate || "Date not available",
        questions: ["What was the main topic of the article?"],
      }
    }
    return output;
  }
);

export async function getNewsAndQuestions(input: GetNewsAndQuestionsInput): Promise<GetNewsAndQuestionsOutput> {
  return getNewsAndQuestionsFlow(input);
}
