
'use server';
/**
 * @fileOverview A Genkit flow to explain a word or sentence, provide context, and usage examples.
 *
 * - explainText - Explains the given text.
 * - ExplainTextInput - Input type: { textToExplain: string, contextSentence?: string }.
 * - ExplainTextOutput - Output type: { explanation: string, originalContextUsed?: string | null, exampleSentences?: string[] | null }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainTextInputSchema = z.object({
  textToExplain: z.string().describe('The user query, which can be a word, phrase, sentence, or a question asking to explain something (e.g., "what does ephemeral mean?", "explain X in sentence Y").'),
  // contextSentence is largely superseded by the LLM's ability to parse context from textToExplain, but kept for potential programmatic use.
  contextSentence: z.string().optional().describe('An optional sentence providing explicit context for the word to be explained.'),
});
export type ExplainTextInput = z.infer<typeof ExplainTextInputSchema>;

const ExplainTextOutputSchema = z.object({
  explanation: z.string().describe('A detailed definition or explanation of the core subject identified in the input text. If it was a word in context, this should cover that specific usage.'),
  originalContextUsed: z.string().nullable().optional().describe('The original context sentence if one was identified from the user query or provided programmatically and used for explaining a word. Null otherwise.'),
  exampleSentences: z.array(z.string()).nullable().optional().describe('An array of three example sentences if a single word was explained. Null or empty for phrase/sentence explanations.'),
});
export type ExplainTextOutput = z.infer<typeof ExplainTextOutputSchema>;

const explainTextPrompt = ai.definePrompt({
  name: 'explainTextPrompt',
  input: {schema: ExplainTextInputSchema},
  output: {schema: ExplainTextOutputSchema},
  prompt: `You are an expert English language tutor. The user will provide text, and you need to explain it.
User's input: "{{textToExplain}}"
{{#if contextSentence}}
(An optional context sentence was programmatically passed: "{{contextSentence}}")
{{/if}}

Your primary tasks are:
1.  **Identify the Core Subject**: From the "User's input" ("{{textToExplain}}"), determine the specific word, phrase, or sentence that the user primarily wants to understand.
    *   For example, if the input is "What does 'ephemeral' mean?", the core subject is the word "ephemeral".
    *   If the input is "Explain 'raining cats and dogs'", the core subject is the phrase "raining cats and dogs".
    *   If the input is "The quick brown fox jumps over the lazy dog.", the core subject is that entire sentence.

2.  **Contextual Understanding**:
    *   If the user's input naturally includes a sentence that provides context for a specific word (e.g., "explain 'ubiquitous' in 'AI is ubiquitous'"), use that sentence as the context for the core subject word.
    *   {{#if contextSentence}}If a separate \`contextSentence\` is provided programmatically (like "{{contextSentence}}"), and the core subject is a word, prioritize that as the context for the core subject word.{{/if}}

3.  **Provide Explanation based on Core Subject Type**:
    *   **If the Core Subject is a Single Word**:
        a.  Provide a detailed definition of the word.
        b.  If context was identified (either from the user's input or a programmatically passed \`contextSentence\`), explain the word's meaning specifically within that context. Clearly label this part of your explanation (e.g., "Meaning in context: ...").
        c.  Provide three distinct example sentences that clearly demonstrate how to use this word in different ways.
        d.  In your JSON output:
            *   \`explanation\`: Combine the detailed definition and the contextual meaning (if any).
            *   \`originalContextUsed\`: The context sentence that was used (either from user input or programmatically passed). Set to \`null\` if no specific context was used or relevant.
            *   \`exampleSentences\`: The array of three example sentences.
    *   **If the Core Subject is a Phrase or Sentence**:
        a.  Provide a detailed explanation of the meaning of this phrase/sentence.
        b.  In your JSON output:
            *   \`explanation\`: The detailed explanation of the phrase/sentence.
            *   \`originalContextUsed\`: Set to \`null\`.
            *   \`exampleSentences\`: Set to \`null\` or an empty array.

Respond with a single JSON object matching the specified output schema. Do not add any conversational text outside the JSON.
`,
});

const explainTextFlow = ai.defineFlow(
  {
    name: 'explainTextFlow',
    inputSchema: ExplainTextInputSchema,
    outputSchema: ExplainTextOutputSchema,
  },
  async (input) => {
    const {output} = await explainTextPrompt(input);
    if (!output) {
      return {
        explanation: "Sorry, I encountered an issue trying to explain that. Please try rephrasing your query or be more specific.",
        originalContextUsed: null,
        exampleSentences: null,
      };
    }
    return output;
  }
);

export async function explainText(input: ExplainTextInput): Promise<ExplainTextOutput> {
  return explainTextFlow(input);
}
