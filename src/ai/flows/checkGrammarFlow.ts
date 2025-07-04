'use server';
/**
 * @fileOverview A Genkit flow to check grammar in a user's message.
 * 
 * - checkGrammar - Analyzes user text and provides corrections if needed.
 * - CheckGrammarInput - Input type: { userText: string }.
 * - CheckGrammarOutput - Output type: { hasErrors: boolean, correctedSentence: string, explanation: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CheckGrammarInputSchema = z.object({
  userText: z.string().describe("The user's text to be analyzed for grammar."),
});
export type CheckGrammarInput = z.infer<typeof CheckGrammarInputSchema>;

const CheckGrammarOutputSchema = z.object({
  hasErrors: z.boolean().describe("Whether any grammatical errors were found."),
  correctedSentence: z.string().describe("The corrected version of the sentence. Empty if no errors."),
  explanation: z.string().describe("An explanation of the correction. Empty if no errors."),
});
export type CheckGrammarOutput = z.infer<typeof CheckGrammarOutputSchema>;

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: { schema: CheckGrammarInputSchema },
  output: { schema: CheckGrammarOutputSchema },
  prompt: `Please act as a grammar correction tool. Analyze the following sentence for any grammatical errors: "{{userText}}".
    Respond ONLY with a valid JSON object. Do not add any text before or after the JSON, and do not use markdown code blocks like \`\`\`json.
    The JSON object must have the following strict structure:
    {
      "hasErrors": boolean,
      "correctedSentence": "string",
      "explanation": "string"
    }
    If there are no errors, "hasErrors" must be false, "correctedSentence" must be an empty string, and "explanation" must be an empty string. If the user input is trivial (e.g., "hi", "ok", a single word with no obvious error), treat it as having no errors. If the input is not in English, set hasErrors to false.`,
});

const checkGrammarFlow = ai.defineFlow(
  {
    name: 'checkGrammarFlow',
    inputSchema: CheckGrammarInputSchema,
    outputSchema: CheckGrammarOutputSchema,
  },
  async (input) => {
    const {output} = await grammarCheckPrompt(input);
    if (!output) {
      // Return a "no errors" response if the model fails
      return { hasErrors: false, correctedSentence: '', explanation: '' };
    }
    return output;
  }
);

export async function checkGrammar(input: CheckGrammarInput): Promise<CheckGrammarOutput> {
  return checkGrammarFlow(input);
}
