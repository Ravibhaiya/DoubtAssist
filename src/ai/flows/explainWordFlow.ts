'use server';
/**
 * @fileOverview A Genkit flow to explain a word in context.
 *
 * - explainWord - Provides a detailed analysis of a word.
 * - ExplainWordInput - Input type: { word: string, context: string }.
 * - ExplainWordOutput - Output type: { word: string, definition: string, contextualMeaning: string, synonyms: string[], antonyms: string[], examples: string[] }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainWordInputSchema = z.object({
  word: z.string().describe("The word to be analyzed."),
  context: z.string().describe("The sentence or context in which the word appeared."),
});
export type ExplainWordInput = z.infer<typeof ExplainWordInputSchema>;

const ExplainWordOutputSchema = z.object({
  word: z.string(),
  definition: z.string().describe("The general dictionary definition of the word."),
  contextualMeaning: z.string().describe("The meaning of the word specifically within the provided context."),
  synonyms: z.array(z.string()).describe("An array of synonyms for the word. Provide an empty array if not applicable."),
  antonyms: z.array(z.string()).describe("An array of antonyms for the word. Provide an empty array if not applicable."),
  examples: z.array(z.string()).describe("An array of 5 example sentences using the word."),
});
export type ExplainWordOutput = z.infer<typeof ExplainWordOutputSchema>;

const explainWordPrompt = ai.definePrompt({
    name: 'explainWordPrompt',
    input: { schema: ExplainWordInputSchema },
    output: { schema: ExplainWordOutputSchema },
    prompt: `Analyze the word "{{word}}" within the context of the sentence: "{{context}}". Provide a detailed analysis in a strict JSON format. Do not include any text, code block markers, or characters outside of the single JSON object. The JSON object must have these keys: "word", "definition", "contextualMeaning", "synonyms" (array), "antonyms" (array), "examples" (array of 5 sentences). If synonyms or antonyms are not applicable, provide an empty array. Ensure the output is clean and directly parsable as JSON.`
});


const explainWordFlow = ai.defineFlow(
  {
    name: 'explainWordFlow',
    inputSchema: ExplainWordInputSchema,
    outputSchema: ExplainWordOutputSchema,
  },
  async (input) => {
    const {output} = await explainWordPrompt(input);
    if (!output) {
      throw new Error('Failed to get a valid explanation from the model.');
    }
    return output;
  }
);

export async function explainWord(input: ExplainWordInput): Promise<ExplainWordOutput> {
  return explainWordFlow(input);
}
