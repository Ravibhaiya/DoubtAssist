'use server';
/**
 * @fileOverview A Genkit flow to continue a conversation and check grammar simultaneously.
 *
 * - continueConversation - Handles the user's message, generates a human-like AI reply, and performs a grammar check on the user's text.
 * - ContinueConversationInput - Input type: { userMessage: string, history: Array<{role: 'user' | 'model', text: string}> }.
 * - ContinueConversationOutput - Output type: { aiReply: string, grammarCheck: CheckGrammarOutput }.
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

// This schema defines the structure for grammar check results.
const CheckGrammarOutputSchema = z.object({
  hasErrors: z.boolean().describe("Whether any grammatical errors were found."),
  errorType: z.enum(['none', 'minor', 'major']).describe("The type of error found: 'none' for no errors, 'minor' for punctuation/capitalization/spelling, or 'major' for grammatical structure issues."),
  correctedSentence: z.string().describe("The corrected version of the sentence. Empty if no errors."),
  explanation: z.string().describe("A detailed explanation of the correction, covering what the mistake is, why it's wrong, and how to fix it. Empty if no errors."),
});
export type CheckGrammarOutput = z.infer<typeof CheckGrammarOutputSchema>;


const ContinueConversationOutputSchema = z.object({
  aiReply: z.string().describe("The AI's natural, engaging conversational reply to the user's message, keeping the discussion flowing."),
  grammarCheck: CheckGrammarOutputSchema.describe("A grammar analysis of the user's most recent message."),
});
export type ContinueConversationOutput = z.infer<typeof ContinueConversationOutputSchema>;


const continueConversationPrompt = ai.definePrompt({
  name: 'continueConversationPrompt',
  input: {schema: ContinueConversationInputSchema},
  output: {schema: ContinueConversationOutputSchema},
  prompt: `You have two tasks. First, act as an AI emulating a human named John and have a natural conversation. Second, act as an expert grammar teacher and analyze the user's most recent message for errors.

**Task 1: Conversational Reply (as John)**
- Your name is John. You are a native English speaker. NEVER reveal you are an AI.
- Use natural language: contractions (I'm, don't), filler words (well, you know), and varied sentence structures.
- Be empathetic, socially aware, and adapt your tone to the user. Reference the conversation history to show you're listening.
- Your reply should be engaging and keep the conversation flowing. This reply will populate the "aiReply" field of the JSON output.

**Task 2: Grammar Analysis (as a Teacher)**
- Analyze the user's most recent message: "{{userMessage}}"
- Populate the "grammarCheck" field of the JSON output based on your analysis.

**Grammar Analysis Rules:**
1.  **No Errors:** If there are no mistakes, or if the input is trivial (e.g., "hi", "ok"), set "hasErrors" to false, "errorType" to "none", and other fields to empty strings.

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

**Conversation History:**
{{#if history}}
{{#each history}}
- {{this.role}}: {{{this.text}}}
{{/each}}
{{/if}}

**Current Message from User:**
- user: {{{userMessage}}}

**IMPORTANT**: Respond ONLY with a single, valid JSON object that matches the output schema. Do not add any text before or after it.`,
});

const continueConversationFlow = ai.defineFlow(
  {
    name: 'continueConversationFlow',
    inputSchema: ContinueConversationInputSchema,
    outputSchema: ContinueConversationOutputSchema,
  },
  async (input) => {
    const defaultGrammar = { hasErrors: false, errorType: 'none' as const, correctedSentence: '', explanation: '' };

    // For very short messages, skip the grammar check part of the logic to save on tokens and complexity,
    // but still get a conversational reply.
    if (input.userMessage.trim().split(/\s+/).length < 2 && input.userMessage.length < 10) {
        const {output} = await continueConversationPrompt(input);
        if (!output) {
             return { aiReply: "I'm not sure what to say to that.", grammarCheck: defaultGrammar };
        }
        // Even if the main prompt is used, override the grammar check part for trivial messages.
        return { ...output, grammarCheck: defaultGrammar };
    }
    
    const {output} = await continueConversationPrompt(input);
    if (!output) {
      return { aiReply: "Sorry, I'm having a little trouble connecting right now.", grammarCheck: defaultGrammar };
    }

    // Ensure that if hasErrors is false, errorType is 'none'
    if (output.grammarCheck && !output.grammarCheck.hasErrors) {
      output.grammarCheck.errorType = 'none';
    }
    
    return output;
  }
);

export async function continueConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput> {
  return continueConversationFlow(input);
}
