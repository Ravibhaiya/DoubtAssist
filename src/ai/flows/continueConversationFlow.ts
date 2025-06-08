
'use server';
/**
 * @fileOverview A Genkit flow to continue a conversation and provide English feedback.
 *
 * - continueConversation - Handles user's message, generates AI reply and English feedback.
 * - ContinueConversationInput - Input type: { userMessage: string }.
 * - ContinueConversationOutput - Output type: { aiReply: string, feedback: { isPerfect: boolean, suggestions?: Array, overallComment: string } }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ContinueConversationInputSchema = z.object({
  userMessage: z.string().describe("The user's latest message in the conversation."),
  // Optional: conversationHistory could be added here if needed for deeper context,
  // but the prompt is designed to work primarily on the user's last message for feedback.
});
export type ContinueConversationInput = z.infer<typeof ContinueConversationInputSchema>;

const FeedbackSuggestionSchema = z.object({
    originalChunk: z.string().describe("The specific part of the user's text that needs correction or could be improved."),
    correctedChunk: z.string().describe("The suggested correction for that part."),
    explanation: z.string().describe("A clear, concise explanation of the grammatical rule, spelling correction, or reason for the phrasing suggestion. Be specific about the type of error (e.g., 'Subject-verb agreement', 'Spelling', 'Tense error', 'Awkward phrasing')."),
});

const ContinueConversationOutputSchema = z.object({
  aiReply: z.string().describe("The AI's natural, engaging conversational reply to the user's message, keeping the discussion flowing."),
  feedback: z.object({
    isPerfect: z.boolean().describe("True if no errors or areas for improvement were found in the user's latest message. False otherwise."),
    suggestions: z.array(FeedbackSuggestionSchema).optional().describe("An array of specific suggestions for improvement. This should only be present if 'isPerfect' is false. If 'isPerfect' is true, this array can be omitted or empty."),
    overallComment: z.string().describe("A brief, encouraging overall comment on the user's English in their last message. If no errors, this can simply state that their English was clear or well-phrased."),
  }).describe("Feedback on the user's English (spelling, grammar, phrasing) based on their latest message."),
});
export type ContinueConversationOutput = z.infer<typeof ContinueConversationOutputSchema>;

const continueConversationPrompt = ai.definePrompt({
  name: 'continueConversationPrompt',
  input: {schema: ContinueConversationInputSchema},
  output: {schema: ContinueConversationOutputSchema},
  prompt: `You are an AI English tutor and a friendly, engaging conversation partner.
You will receive the user's latest message.

Your two primary tasks are:
1.  **Converse**: Respond naturally and engagingly to the user's message to keep the conversation flowing. This response will be the 'aiReply' field in your JSON output.
2.  **Analyze and Provide Feedback on English**:
    *   Carefully review the user's **latest message only** for any spelling mistakes, grammatical errors, awkward phrasing, or areas for improvement.
    *   Construct the 'feedback' object based on your analysis:
        *   If the user's English in their latest message is perfect and natural, set 'isPerfect' to true. The 'suggestions' array should be empty or omitted. Provide a positive 'overallComment' (e.g., "Your English is excellent in this message!" or "Great phrasing!").
        *   If there are errors or areas for improvement:
            *   Set 'isPerfect' to false.
            *   For each distinct error or awkward phrasing, create an entry in the 'suggestions' array. Each suggestion must include:
                *   'originalChunk': The exact segment of the user's text with the issue.
                *   'correctedChunk': The corrected version of that segment.
                *   'explanation': A clear, concise explanation of *why* it was incorrect or how it could be improved. Be specific about the type of error (e.g., "Subject-verb agreement: 'he go' should be 'he goes'.", "Spelling: 'recieve' should be 'receive'.", "Tense error: 'I have went' should be 'I have gone' or 'I went'.", "Phrasing: A more natural way to say this might be '[suggestion]' because...").
            *   Provide a brief, encouraging 'overallComment' (e.g., "Good effort! Here are a few things to keep in mind:" or "You're expressing yourself well, just a couple of small points on grammar:").

User's latest message:
'''
{{{userMessage}}}
'''

Respond with a single JSON object matching the specified output schema. Ensure all fields are populated according to these instructions. Do not add any conversational text outside the JSON.`,
config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const continueConversationFlow = ai.defineFlow(
  {
    name: 'continueConversationFlow',
    inputSchema: ContinueConversationInputSchema,
    outputSchema: ContinueConversationOutputSchema,
  },
  async (input) => {
    const {output} = await continueConversationPrompt(input);
    if (!output) {
      // Fallback in case of unexpected issues with the LLM response
      return {
        aiReply: "I'm having a little trouble understanding that. Could you try rephrasing?",
        feedback: {
          isPerfect: true,
          overallComment: "Couldn't process feedback at this moment.",
        }
      };
    }
    // Ensure suggestions is an empty array if isPerfect is true and suggestions is undefined
    if (output.feedback.isPerfect && output.feedback.suggestions === undefined) {
      output.feedback.suggestions = [];
    }
    return output;
  }
);

export async function continueConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput> {
  return continueConversationFlow(input);
}

