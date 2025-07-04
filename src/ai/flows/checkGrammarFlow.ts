'use server';
/**
 * @fileOverview A Genkit flow to check grammar in a user's message.
 * 
 * - checkGrammar - Analyzes user text and provides corrections if needed.
 * - CheckGrammarInput - Input type: { userText: string }.
 * - CheckGrammarOutput - Output type: { hasErrors: boolean, errorType: 'none' | 'minor' | 'major', correctedSentence: string, explanation: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const CheckGrammarInputSchema = z.object({
  userText: z.string().describe("The user's text to be analyzed for grammar."),
});
export type CheckGrammarInput = z.infer<typeof CheckGrammarInputSchema>;

const CheckGrammarOutputSchema = z.object({
  hasErrors: z.boolean().describe("Whether any grammatical errors were found."),
  errorType: z.enum(['none', 'minor', 'major']).describe("The type of error found: 'none' for no errors, 'minor' for punctuation/capitalization/spelling, or 'major' for grammatical structure issues."),
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
      "errorType": "'none' | 'minor' | 'major'",
      "correctedSentence": "string",
      "explanation": "string"
    }
    
    Error Classification Rules:
    - If there are no errors: "hasErrors" must be false, "errorType" must be "none", and the other fields must be empty strings.
    - If the user input is trivial (e.g., "hi", "ok", a single word with no obvious error), treat it as having no errors.
    - If there are only minor mistakes (e.g., spelling, punctuation, capitalization): "hasErrors" must be true, and "errorType" must be "minor".
    - If there are major grammatical errors (e.g., sentence structure, verb tense, subject-verb agreement, word choice): "hasErrors" must be true, and "errorType" must be "major".
    - If the input is not in English, set hasErrors to false and errorType to "none".`,
});

const checkGrammarFlow = ai.defineFlow(
  {
    name: 'checkGrammarFlow',
    inputSchema: CheckGrammarInputSchema,
    outputSchema: CheckGrammarOutputSchema,
  },
  async (input) => {
    // Don't check grammar for very short messages
    if (input.userText.trim().split(/\s+/).length < 2 && input.userText.length < 10) {
      return { hasErrors: false, errorType: 'none', correctedSentence: '', explanation: '' };
    }

    const {output} = await grammarCheckPrompt(input);
    if (!output) {
      // Return a "no errors" response if the model fails
      return { hasErrors: false, errorType: 'none', correctedSentence: '', explanation: '' };
    }
    // Ensure that if hasErrors is false, errorType is 'none'
    if (!output.hasErrors) {
      output.errorType = 'none';
    }
    return output;
  }
);

export async function checkGrammar(input: CheckGrammarInput): Promise<CheckGrammarOutput> {
  return checkGrammarFlow(input);
}
