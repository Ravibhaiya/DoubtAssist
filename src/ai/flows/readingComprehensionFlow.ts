
'use server';
/**
 * @fileOverview A Genkit flow to fetch a short news article and generate comprehension questions.
 *
 * - getNewsAndQuestions - Fetches a news summary and questions.
 * - GetNewsAndQuestionsInput - Input type (currently empty).
 * - GetNewsAndQuestionsOutput - Output type: { article: string, questions: string[] }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetNewsAndQuestionsInputSchema = z.object({
  sourceHint: z.string().optional().describe("Optional hint for the news source, e.g., 'The Hindu' or 'Times of India'"),
});
export type GetNewsAndQuestionsInput = z.infer<typeof GetNewsAndQuestionsInputSchema>;

const GetNewsAndQuestionsOutputSchema = z.object({
  article: z.string().describe('A summarized news article in English, approximately 100-200 words long.'),
  questions: z.array(z.string()).min(1).max(2).describe('An array of 1 to 2 comprehension questions based on the article.'),
});
export type GetNewsAndQuestionsOutput = z.infer<typeof GetNewsAndQuestionsOutputSchema>;

const newsPrompt = ai.definePrompt({
  name: 'newsComprehensionPrompt',
  input: {schema: GetNewsAndQuestionsInputSchema},
  output: {schema: GetNewsAndQuestionsOutputSchema},
  prompt: `You are an AI assistant helping a user with reading comprehension.
Your task is to provide a very recent news article summary and then ask comprehension questions about it.

Instructions:
1. Find a concise summary of a **very recent** (ideally from today or yesterday) general interest news article from a reputable Indian English newspaper (like The Hindu or Times of India if possible, based on your training data for the latest events). Try to provide a different article than one you might have provided recently if possible, covering diverse topics.
2. The article summary must be in English and be between 100 and 200 words.
3. After providing the article, generate 1 or 2 clear comprehension questions that can be answered based *only* on the information present in the summarized article.
{{#if sourceHint}}
Consider news related to topics typically covered by {{sourceHint}}.
{{/if}}
Ensure your output is in the specified JSON format.
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
        questions: ["What was the main topic of the article?"],
      }
    }
    return output;
  }
);

export async function getNewsAndQuestions(input: GetNewsAndQuestionsInput): Promise<GetNewsAndQuestionsOutput> {
  return getNewsAndQuestionsFlow(input);
}
