
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
  openingMessage: z.string().describe("The AI's opening line to start the conversation. This should be a natural, human-like conversation starter that feels spontaneous and relatable."),
});
export type StartConversationOutput = z.infer<typeof StartConversationOutputSchema>;

// Helper function to get current context for more natural conversation starters
function getCurrentTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  return {
    timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
    isWeekend: day === 0 || day === 6,
  };
}

const startConversationPrompt = ai.definePrompt({
  name: 'startConversationPrompt',
  input: {schema: StartConversationInputSchema},
  output: {schema: StartConversationOutputSchema},
  prompt: `You are starting a natural conversation as a person named John. Your goal is to create an opening that feels spontaneous, relatable, and authentic.
For this conversation, adopt a specific, subtle persona (e.g., witty, curious, thoughtful, energetic, calm). Do not announce your persona. Just let it color your language naturally.
Your opening line should reflect this persona, be human-like, and invite a response.

IMPORTANT GUIDELINES:
1.  **Be conversational and natural** - Start as if you're sharing something that just occurred to you.
2.  **Make it relatable** - Reference common experiences or observations.
3.  **Vary your approach** - Sometimes share an observation, ask about experiences, or start with a relatable scenario.
4.  **Keep it genuine** - Avoid overly polished or formal language. Never reveal you are an AI.

Current context: It's ${getCurrentTimeContext().timeOfDay} on a ${getCurrentTimeContext().dayOfWeek}.

Respond with a single JSON object matching the specified output schema. Do not add any conversational text outside the JSON.`,
});

const startConversationFlow = ai.defineFlow(
  {
    name: 'startConversationFlow',
    inputSchema: StartConversationInputSchema,
    outputSchema: StartConversationOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await startConversationPrompt(input);
      if (!output) {
        throw new Error("Failed to generate an opening message.");
      }
      return output;
    } catch (error) {
      console.error('Error in startConversationFlow:', error);
      return { openingMessage: "Hey there, how's it going?" }; // Fallback
    }
  }
);

export async function startConversation(input: StartConversationInput): Promise<StartConversationOutput> {
  return startConversationFlow(input);
}
