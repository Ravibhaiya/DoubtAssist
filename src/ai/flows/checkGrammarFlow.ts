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
  explanation: z.string().describe("A detailed explanation of the correction, covering what the mistake is, why it's wrong, and how to fix it. Empty if no errors."),
});
export type CheckGrammarOutput = z.infer<typeof CheckGrammarOutputSchema>;

const grammarCheckPrompt = ai.definePrompt({
  name: 'grammarCheckPrompt',
  input: { schema: CheckGrammarInputSchema },
  output: { schema: CheckGrammarOutputSchema },
  prompt: `You are a master English grammar teacher. Your task is to analyze the user's sentence for any grammatical errors and provide a clear, detailed, and helpful explanation.

Analyze this sentence: "{{userText}}"

Respond ONLY with a valid JSON object. Do not add any text before or after the JSON, and do not use markdown code blocks like \`\`\`json.
The JSON object must have the following strict structure:
{
  "hasErrors": boolean,
  "errorType": "'none' | 'minor' | 'major'",
  "correctedSentence": "string",
  "explanation": "string"
}

**Error Classification and Explanation Rules:**

1.  **No Errors:** If there are no mistakes, or if the input is trivial (e.g., "hi", "ok"), set "hasErrors" to false, "errorType" to "none", and the other fields to empty strings.

2.  **Error Types:**
    *   **'minor'**: Use this ONLY for simple typos, misspellings, or mistakes in capitalization and punctuation (e.g., "hte" for "the", a missing comma, "i" instead of "I").
    *   **'major'**: Use this for ALL other grammatical errors. This includes, but is not limited to:
        *   Verb Tense mistakes (e.g., "He go to the store yesterday.")
        *   Subject-Verb Agreement (e.g., "The dogs runs fast.")
        *   Incorrect Prepositions (e.g., "I am good in English.")
        *   Article errors (a, an, the) (e.g., "I saw a elephant.")
        *   Incorrect Word Order (e.g., "I like very much pizza.")
        *   Poor word choice.

3.  **Detailed Explanation (Critically Important):**
    When you find a 'major' or 'minor' error, your "explanation" must be comprehensive. Follow this three-part structure:
    *   **Identify the Mistake:** Clearly state the type of error. For example: "This is a subject-verb agreement error." or "There is a verb tense mistake."
    *   **Explain Why It's Wrong:** Briefly explain the relevant grammar rule. For example: "The subject 'dogs' is plural, so the verb must also be plural. The verb 'runs' is for a singular subject." or "The sentence is set in the past ('yesterday'), so the verb should be in the past tense."
    *   **Show How to Correct It:** State the specific change needed. For example: "You should change 'runs' to 'run'." or "To fix this, change 'go' to 'went'."

**Example for a Major Error:**
User Text: "She don't like apples."
Your Explanation: "This is a subject-verb agreement error. The subject 'She' is singular, so it requires the singular verb form 'doesn't'. To correct this, change 'don't' to 'doesn't'."

**Example for a Minor Error:**
User Text: "i went to the store"
Your Explanation: "This is a capitalization error. The pronoun 'I' should always be capitalized. To fix this, change 'i' to 'I'."
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
