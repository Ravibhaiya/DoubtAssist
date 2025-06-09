'use server';
/**
 * @fileOverview A Genkit flow to answer user questions about a given article.
 *
 * - answerArticleQuery - Answers the user's query based on the article.
 * - AnswerArticleQueryInput - Input type: { article: string, userQuery: string }.
 * - AnswerArticleQueryOutput - Output type: { answer: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnswerArticleQueryInputSchema = z.object({
  article: z.string().describe('The news article text.'),
  userQuery: z.string().describe("The user's question about the article."),
});
export type AnswerArticleQueryInput = z.infer<typeof AnswerArticleQueryInputSchema>;

const AnswerArticleQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user query, based *only* on the provided article. If the answer is not in the article, state that clearly.'),
});
export type AnswerArticleQueryOutput = z.infer<typeof AnswerArticleQueryOutputSchema>;

const articleQueryPrompt = ai.definePrompt({
  name: 'articleQueryPrompt',
  input: {schema: AnswerArticleQueryInputSchema},
  output: {schema: AnswerArticleQueryOutputSchema},
  prompt: `You are a helpful assistant. The user has read the following news article and is now asking a question about it.
Your task is to answer the user's query based *solely* on the information explicitly or implicitly available in the provided article text.
Do not use any external knowledge. If the information to answer the query is not present in the article, you MUST clearly state that the article does not contain that information. For example, say "The article does not provide information on that topic."

News Article:
'''
{{article}}
'''

User's Question: "{{userQuery}}"

Provide your answer in the specified JSON format.
`,
});

const answerArticleQueryFlow = ai.defineFlow(
  {
    name: 'answerArticleQueryFlow',
    inputSchema: AnswerArticleQueryInputSchema,
    outputSchema: AnswerArticleQueryOutputSchema,
  },
  async (input) => {
    const {output} = await articleQueryPrompt(input);
    if (!output) {
      // This case should ideally be handled by the model returning a structured "cannot answer"
      // but as a fallback:
      return { answer: "I encountered an issue trying to process your question about the article." };
    }
    return output;
  }
);

export async function answerArticleQuery(input: AnswerArticleQueryInput): Promise<AnswerArticleQueryOutput> {
  return answerArticleQueryFlow(input);
}
