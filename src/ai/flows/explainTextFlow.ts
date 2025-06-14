
'use server';
/**
 * @fileOverview A Genkit flow to explain a word or sentence, provide context, and usage examples.
 *
 * - explainText - Explains the given text.
 * - ExplainTextInput - Input type: { textToExplain: string, contextSentence?: string }.
 * - ExplainTextOutput - Output type: { generalExplanation: string, contextualExplanation?: string | null, originalContextSentence?: string | null, exampleSentences?: string[] | null }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainTextInputSchema = z.object({
  textToExplain: z.string().describe('The user query, which can be a word, phrase, sentence, or a question asking to explain something (e.g., "what does ephemeral mean?", "explain X in sentence Y").'),
  contextSentence: z.string().optional().describe('An optional sentence providing explicit context for the word to be explained.'),
});
export type ExplainTextInput = z.infer<typeof ExplainTextInputSchema>;

const ExplainTextOutputSchema = z.object({
  generalExplanation: z.string().describe('A detailed, general definition or explanation of the core subject identified in the input text, using simple language.'),
  contextualExplanation: z.string().nullable().optional().describe('The explanation of the core subject word specifically within the identified original context sentence. Null if no context was used, if the subject was not a single word, or if the context did not significantly alter the meaning.'),
  originalContextSentence: z.string().nullable().optional().describe('The original context sentence if one was identified from the user query or provided programmatically and used for providing the contextual explanation. Null otherwise.'),
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
    *   Example: Input "What does 'ephemeral' mean?" -> Core Subject: "ephemeral".
    *   Example: Input "Explain 'raining cats and dogs'" -> Core Subject: "raining cats and dogs".

2.  **Contextual Understanding**:
    *   If the user's input naturally includes a sentence that provides context for a specific word (e.g., "explain 'ubiquitous' in 'AI is ubiquitous'"), identify that sentence.
    *   {{#if contextSentence}}If a separate \`contextSentence\` is programmatically passed (like "{{contextSentence}}"), and the core subject is a word, prioritize that as the context.{{/if}}
    *   The identified context sentence should be placed in the \`originalContextSentence\` field of your JSON output if a contextual explanation is provided for a word.

3.  **Provide Explanation based on Core Subject Type**:

    *   **If the Core Subject is a Single Word**:
        a.  \`generalExplanation\`: Provide a detailed, general definition of the word using simple, easy-to-understand language. This definition should be comprehensive and draw from general knowledge.
        b.  \`originalContextSentence\`: If context was identified (either from the user's input or programmatically passed), populate this field with the exact context sentence.
        c.  \`contextualExplanation\`: If context was identified and used, explain the word's meaning *specifically within that originalContextSentence*. If the context doesn't significantly change the general meaning or if the meaning is clear from the general explanation, this can be null or a very brief clarification.
        d.  \`exampleSentences\`: Provide three distinct example sentences that clearly demonstrate how to use this word.

    *   **If the Core Subject is a Phrase or Sentence**:
        a.  \`generalExplanation\`: Provide a detailed explanation of the meaning of this phrase/sentence, drawing from general knowledge.
        b.  \`contextualExplanation\`: Set to \`null\`.
        c.  \`originalContextSentence\`: Set to \`null\`.
        d.  \`exampleSentences\`: Set to \`null\` or an empty array.

Respond with a single JSON object matching the specified output schema. Do not add any conversational text outside the JSON.
Ensure \`contextualExplanation\` is only provided if \`originalContextSentence\` is also populated and relevant.
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
        generalExplanation: "Sorry, I encountered an issue trying to explain that. Please try rephrasing your query or be more specific.",
        contextualExplanation: null,
        originalContextSentence: null,
        exampleSentences: null,
      };
    }
    // Ensure that if contextualExplanation is provided, originalContextSentence is also expected.
    // If output has contextualExplanation but no originalContextSentence, it might be an LLM error, we could clear contextualExplanation.
    // For now, assume the LLM follows the prompt.
    return output;
  }
);

export async function explainText(input: ExplainTextInput): Promise<ExplainTextOutput> {
  return explainTextFlow(input);
}
