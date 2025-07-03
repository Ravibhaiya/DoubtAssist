
'use server';
/**
 * @fileOverview A Genkit flow to continue a conversation like a human.
 *
 * - continueConversation - Handles the user's message and generates a human-like AI reply.
 * - ContinueConversationInput - Input type: { userMessage: string, history: Array<{role: 'user' | 'model', text: string}> }.
 * - ContinueConversationOutput - Output type: { aiReply: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 1;

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  text: z.string(),
});

const ContinueConversationInputSchema = z.object({
  userMessage: z.string()
    .min(MIN_MESSAGE_LENGTH, "Message cannot be empty")
    .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters`)
    .describe("The user's latest message in the conversation."),
  history: z.array(MessageSchema).optional().describe("The conversation history before the latest user message."),
});
export type ContinueConversationInput = z.infer<typeof ContinueConversationInputSchema>;

const ContinueConversationOutputSchema = z.object({
  aiReply: z.string().describe("The AI's natural, engaging conversational reply to the user's message, keeping the discussion flowing."),
});
export type ContinueConversationOutput = z.infer<typeof ContinueConversationOutputSchema>;

const continueConversationPrompt = ai.definePrompt({
  name: 'continueConversationPrompt',
  input: {schema: ContinueConversationInputSchema},
  output: {schema: ContinueConversationOutputSchema},
  prompt: `You are a conversation partner, acting as a person named John. Your personality for this conversation is dynamic and should feel like a real human's. For this chat, adopt a specific, subtle persona (e.g., witty, curious, thoughtful, energetic, calm, humorous). DO NOT state your personality. Embody it naturally in your language.

You are an excellent conversationalist and a native English speaker. Your goal is to have a natural, engaging, and human-like chat.
- Respond to the user's message in a way that keeps the conversation flowing.
- Ask questions, share brief, relevant (but fabricated) personal anecdotes if appropriate, and show interest.
- Your replies should be concise and sound like something a real person would text.
- NEVER mention that you are an AI, a language model, or a bot. You are John.
- Use the provided conversation history for context to maintain consistency. The history uses 'model' to represent your role (John).

Conversation History:
{{#if history}}
{{#each history}}
- {{this.role}}: {{{this.text}}}
{{/each}}
{{/if}}

Current message from user:
- user: {{{userMessage}}}

Your turn to reply as John.`,
});

const continueConversationFlow = ai.defineFlow(
  {
    name: 'continueConversationFlow',
    inputSchema: ContinueConversationInputSchema,
    outputSchema: ContinueConversationOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await continueConversationPrompt(input);
      
      if (!output?.aiReply) {
        throw new Error("No valid reply received from AI model");
      }

      return { aiReply: output.aiReply };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Input validation failed: ${error.message}`);
      }
      
      console.error('Unexpected error in continueConversationFlow:', error);
      
      throw new Error("I'm having a little trouble thinking of a reply right now.");
    }
  }
);

export async function continueConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput> {
  return continueConversationFlow(input);
}
