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
    - If there are no errors, or if the input is trivial (e.g., "hi", "ok"), set "hasErrors" to false and "errorType" to "none".
    - **Minor Errors (for 'minor' errorType)**: Use this for mistakes related to typing, spelling, punctuation, or capitalization. For example, a typo like "hte" instead of "the", a missing comma, or a lowercase "i" for the pronoun "I". These are not fundamental grammar errors.
    - **Major Errors (for 'major' errorType)**: Use this for all fundamental grammatical and tense-related mistakes. This includes incorrect sentence structure, verb tense issues, subject-verb agreement problems, and poor word choice. Any error that affects the core meaning or grammatical correctness of the sentence is a major error.
    - **Tense-Specific Feedback**: If you find a verb tense mistake (which is a 'major' error), your explanation must clearly state that it's a tense error and explain how to fix it. For example: "The verb 'goes' is in the wrong tense. It should be 'went' to match the past-tense context of the sentence."
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
