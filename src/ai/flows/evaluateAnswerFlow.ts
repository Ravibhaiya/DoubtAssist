
'use server';
/**
 * @fileOverview A Genkit flow to evaluate a user's answer to a comprehension question and check grammar.
 *
 * - evaluateUserAnswer - Evaluates the answer.
 * - EvaluateUserAnswerInput - Input type: { article: string, question: string, userAnswer: string }.
 * - EvaluateUserAnswerOutput - Output type: { isCorrect: boolean, feedback: string, grammarFeedback: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateUserAnswerInputSchema = z.object({
  article: z.string().describe('The original news article provided to the user.'),
  question: z.string().describe('The comprehension question asked to the user.'),
  userAnswer: z.string().describe("The user's answer to the question."),
});
export type EvaluateUserAnswerInput = z.infer<typeof EvaluateUserAnswerInputSchema>;

const EvaluateUserAnswerOutputSchema = z.object({
  isCorrect: z.boolean().describe("Whether the user's answer is substantially correct based *only* on the provided article text."),
  feedback: z.string().describe("A brief explanation for why the answer is correct or incorrect, referencing the article's content."),
  grammarFeedback: z.string().describe("Brief, constructive feedback on the user's grammar. If grammar is incorrect, explain *why* it's incorrect (e.g., subject-verb agreement, tense error, incorrect preposition) and suggest a correction. If grammar is perfect, say so."),
});
export type EvaluateUserAnswerOutput = z.infer<typeof EvaluateUserAnswerOutputSchema>;

const evaluationPrompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  input: {schema: EvaluateUserAnswerInputSchema},
  output: {schema: EvaluateUserAnswerOutputSchema},
  prompt: `You are an English language and reading comprehension tutor.
You have been provided with a news article, a question about that article, and a user's answer to that question.

Your tasks are:
1. Evaluate if the user's answer is correct. The answer must be based *solely* on the information explicitly or implicitly available in the provided article text. Do not use external knowledge.
2. Provide a brief explanation for your evaluation (why it's correct or incorrect).
3. Provide brief, constructive feedback on the user's grammar in their answer. If the grammar is incorrect, you MUST explain *why* it is incorrect, detailing the specific error (e.g., 'subject-verb agreement error: "he go" should be "he goes"', 'incorrect tense: "I have went" should be "I have gone" or "I went" depending on context', 'wrong preposition: "depend on" not "depend in"'). Suggest a clear correction. If the grammar is excellent, acknowledge this.

Original News Article:
'''
{{article}}
'''

Question Asked: "{{question}}"

User's Answer: "{{userAnswer}}"

Provide your evaluation in the specified JSON format.
`,
});

const evaluateUserAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateUserAnswerFlow',
    inputSchema: EvaluateUserAnswerInputSchema,
    outputSchema: EvaluateUserAnswerOutputSchema,
  },
  async (input) => {
    const {output} = await evaluationPrompt(input);
    if (!output) {
      throw new Error('Failed to evaluate the answer.');
    }
    return output;
  }
);

export async function evaluateUserAnswer(input: EvaluateUserAnswerInput): Promise<EvaluateUserAnswerOutput> {
  return evaluateUserAnswerFlow(input);
}
