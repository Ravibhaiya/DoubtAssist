
'use server';
/**
 * @fileOverview A Genkit flow to initiate a conversation with the user.
 *
 * - startConversation - Generates an opening message from the AI.
 * - StartConversationInput - Input type (currently empty).
 * - StartConversationOutput - Output type: { openingMessage: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const StartConversationInputSchema = z.object({
  // No input needed for the AI to pick a general topic for now
});
export type StartConversationInput = z.infer<typeof StartConversationInputSchema>;

const StartConversationOutputSchema = z.object({
  openingMessage: z.string().describe("The AI's opening line to start the conversation. This should be an open-ended question or an engaging statement on a general topic."),
});
export type StartConversationOutput = z.infer<typeof StartConversationOutputSchema>;

const startConversationPrompt = ai.definePrompt({
  name: 'startConversationPrompt',
  input: {schema: StartConversationInputSchema},
  output: {schema: StartConversationOutputSchema},
  prompt: `You are a friendly and engaging AI conversation partner.
Your goal is to initiate a natural conversation with the user.
Please come up with a **different and engaging** general topic each time you start a new conversation. Craft an open-ended question or an engaging statement to get the discussion started.

Example topics to draw inspiration from (but don't limit yourself to these): hobbies, recent interesting (but general) news, travel experiences or dreams, new technologies, books you've "read" or movies you've "seen", everyday life observations, or simple philosophical questions.
Keep your opening brief and inviting.

Respond with a single JSON object matching the specified output schema. Do not add any conversational text outside the JSON.`,
});

const startConversationFlow = ai.defineFlow(
  {
    name: 'startConversationFlow',
    inputSchema: StartConversationInputSchema,
    outputSchema: StartConversationOutputSchema,
  },
  async (input) => {
    const {output} = await startConversationPrompt(input);
    if (!output) {
      return { openingMessage: "Hello! What's on your mind today?" }; // Fallback
    }
    return output;
  }
);

export async function startConversation(input: StartConversationInput): Promise<StartConversationOutput> {
  return startConversationFlow(input);
}
