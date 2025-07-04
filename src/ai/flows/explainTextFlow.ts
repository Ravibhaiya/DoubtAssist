
'use server';
/**
 * @fileOverview A Genkit flow to explain a word, provide context, synonyms, antonyms, and usage examples.
 *
 * - explainText - Explains the given text.
 * - ExplainTextInput - Input type: { textToExplain: string, contextSentence: string }.
 * - ExplainTextOutput - Output type: { generalExplanation, contextualExplanation, synonyms, antonyms, exampleSentences }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainTextInputSchema = z.object({
  textToExplain: z.string().describe('The word or short phrase to be explained.'),
  contextSentence: z.string().describe('The sentence in which the text to explain appears, providing context.'),
});
export type ExplainTextInput = z.infer<typeof ExplainTextInputSchema>;

const ExplainTextOutputSchema = z.object({
  generalExplanation: z.string().describe('A detailed, general definition of the word/phrase using simple language.'),
  contextualExplanation: z.string().describe("The explanation of the word's meaning specifically within the provided context sentence."),
  synonyms: z.array(z.string()).describe('An array of synonyms for the word/phrase.'),
  antonyms: z.array(z.string()).describe('An array of antonyms for the word/phrase.'),
  exampleSentences: z.array(z.string()).max(5).describe('An array of 5 example sentences demonstrating how to use the word/phrase.'),
});
export type ExplainTextOutput = z.infer<typeof ExplainTextOutputSchema>;

const explainTextPrompt = ai.definePrompt({
  name: 'explainTextPrompt',
  input: {schema: ExplainTextInputSchema},
  output: {schema: ExplainTextOutputSchema},
  prompt: `You are an expert English language tutor. Your task is to provide a detailed analysis of a specific word.

The user has selected the word: "{{textToExplain}}"
It appeared in the following sentence: "{{contextSentence}}"

Provide a comprehensive analysis in the specified JSON format with the following fields:
1.  \`generalExplanation\`: Give a clear, general definition of "{{textToExplain}}".
2.  \`contextualExplanation\`: Explain what "{{textToExplain}}" means specifically in the context of the sentence: "{{contextSentence}}".
3.  \`synonyms\`: List several common synonyms for "{{textToExplain}}". If there are no common synonyms, provide an empty array.
4.  \`antonyms\`: List several common antonyms for "{{textToExplain}}". If there are no common antonyms, provide an empty array.
5.  \`exampleSentences\`: Provide exactly five distinct and clear example sentences that show how to use "{{textToExplain}}" correctly.

Your response must be a single JSON object that strictly adheres to the output schema.
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
      throw new Error('Failed to get explanation from AI model.');
    }
    return output;
  }
);

export async function explainText(input: ExplainTextInput): Promise<ExplainTextOutput> {
  return explainTextFlow(input);
}
