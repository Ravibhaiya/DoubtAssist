'use server';
/**
 * @fileOverview A Genkit flow to explain each sentence of a message.
 *
 * - explainMessage - Provides a simple explanation for each sentence in a given text.
 * - ExplainMessageInput - Input type: { message: string }.
 * - ExplainMessageOutput - Output type: { explanations: Array<{ sentence: string; explanation: string; }> }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ExplainMessageInputSchema = z.object({
  message: z.string().describe("The message to be analyzed and explained."),
});
export type ExplainMessageInput = z.infer<typeof ExplainMessageInputSchema>;

const SentenceExplanationSchema = z.object({
    sentence: z.string().describe("The original sentence from the message."),
    explanation: z.string().describe("The explanation of the sentence in simple English."),
});

const ExplainMessageOutputSchema = z.object({
  explanations: z.array(SentenceExplanationSchema).describe("An array of sentence explanations."),
});
export type ExplainMessageOutput = z.infer<typeof ExplainMessageOutputSchema>;

const explainMessagePrompt = ai.definePrompt({
    name: 'explainMessagePrompt',
    input: { schema: ExplainMessageInputSchema },
    output: { schema: ExplainMessageOutputSchema },
    prompt: `Analyze the following message: "{{message}}".
    
    Your task is to:
    1.  Break the message down into individual sentences.
    2.  For each sentence, provide a simple, clear explanation of its meaning in plain English.
    
    Respond ONLY with a valid JSON object. Do not include any text, code block markers, or characters outside of the single JSON object.
    The JSON object must have a single key "explanations", which is an array of objects. Each object in the array must have these two keys: "sentence" and "explanation".
    
    Example:
    Input: "I'm feeling a bit under the weather, so I might just call it a day."
    Output:
    {
      "explanations": [
        {
          "sentence": "I'm feeling a bit under the weather, so I might just call it a day.",
          "explanation": "This means the speaker is feeling slightly sick and because of that, they are thinking about stopping their work or activities for the day."
        }
      ]
    }`
});


const explainMessageFlow = ai.defineFlow(
  {
    name: 'explainMessageFlow',
    inputSchema: ExplainMessageInputSchema,
    outputSchema: ExplainMessageOutputSchema,
  },
  async (input) => {
    const {output} = await explainMessagePrompt(input);
    if (!output) {
      throw new Error('Failed to get a valid explanation from the model.');
    }
    return output;
  }
);

export async function explainMessage(input: ExplainMessageInput): Promise<ExplainMessageOutput> {
  return explainMessageFlow(input);
}
