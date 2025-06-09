
'use server';
/**
 * @fileOverview A Genkit flow to continue a conversation and provide comprehensive English feedback.
 *
 * - continueConversation - Handles user's message, generates AI reply and detailed English feedback.
 * - ContinueConversationInput - Input type: { userMessage: string }.
 * - ContinueConversationOutput - Output type: { aiReply: string, feedback: { ... } }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const ContinueConversationInputSchema = z.object({
  userMessage: z.string().describe("The user's latest message in the conversation."),
});
export type ContinueConversationInput = z.infer<typeof ContinueConversationInputSchema>;

const GrammarSuggestionSchema = z.object({
  originalChunk: z.string().describe("The specific part of the user's text with a grammar or spelling error."),
  correctedChunk: z.string().describe("The suggested correction for that part."),
  explanation: z.string().describe("A clear, concise, and simple explanation of the error and correction, avoiding technical jargon. E.g., 'Use 'goes' with 'she' for present actions.' or 'It should be 'an apple' because 'apple' starts with a vowel sound.'"),
});

const VocabularySuggestionSchema = z.object({
  originalWordOrPhrase: z.string().describe("The simple, less natural, or slightly incorrect word/phrase used by the user."),
  suggestedAlternative: z.string().describe("A stronger, more natural, or more appropriate vocabulary alternative."),
  reasonOrBenefit: z.string().describe("A brief explanation of why the alternative is better (e.g., 'sounds more natural in conversation', 'is more expressive', 'is the common way to say this')."),
  exampleSentences: z.array(z.string()).optional().describe("One or two example sentences showing how to use the suggested alternative. Omit if not easily applicable or if the suggestion is very simple.")
});

const FluencyFeedbackSchema = z.object({
  clarityComment: z.string().optional().describe("Comment on the clarity of the user's message. E.g., 'Your message was very clear.' or 'This part was a bit hard to follow.'"),
  expressionComment: z.string().optional().describe("Comment on how naturally the user expressed themselves. E.g., 'You expressed that idea very naturally!'"),
  toneComment: z.string().optional().describe("Comment on the perceived tone of the message, if relevant. E.g., 'Your tone was friendly and polite.'"),
  alternativePhrasing: z.string().optional().describe("If the user's sentence structure was awkward or could be improved for fluency, suggest a more natural way to phrase it, with a simple explanation. E.g., 'Instead of 'What you do yesterday?', you could say: 'What did you do yesterday?' This sounds more natural for past questions.'"),
  overallFluencyComment: z.string().describe("A general comment on the user's conversational fluency in this message, considering aspects like flow and naturalness."),
});

const ComprehensiveFeedbackSchema = z.object({
  isGrammaticallyPerfect: z.boolean().describe("True if no grammatical, spelling, or punctuation errors were found in the user's latest message. False otherwise."),
  grammarSuggestions: z.array(GrammarSuggestionSchema).optional().describe("An array of specific corrections for grammar, spelling, or punctuation. This should only be present if 'isGrammaticallyPerfect' is false or if very minor, helpful corrections are noted."),
  vocabularySuggestions: z.array(VocabularySuggestionSchema).optional().describe("Suggestions for better word choices or more natural phrasing, even if the original was not strictly incorrect. Provide these if opportunities for improvement exist."),
  fluencyFeedback: FluencyFeedbackSchema.optional().describe("Overall feedback on conversational fluency, clarity, and naturalness of expression."),
  overallComment: z.string().describe("A brief, encouraging summary comment on the user's English in their last message, considering all aspects of feedback. This comment should always be present."),
}).describe("Detailed feedback on the user's English (grammar, spelling, vocabulary, fluency) based on their latest message.");
export type ComprehensiveFeedback = z.infer<typeof ComprehensiveFeedbackSchema>;


const ContinueConversationOutputSchema = z.object({
  aiReply: z.string().describe("The AI's natural, engaging conversational reply to the user's message, keeping the discussion flowing."),
  feedback: ComprehensiveFeedbackSchema,
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
2.  **Analyze and Provide Comprehensive English Feedback**: Carefully review the user's **latest message only** and construct the 'feedback' object according to the 'ComprehensiveFeedbackSchema'.

    **A. Grammar, Spelling, and Punctuation Correction:**
    *   Identify any errors (e.g., verb tense, subject-verb agreement, articles, prepositions, spelling, punctuation).
    *   If errors exist, set 'isGrammaticallyPerfect' to false. For each error, add an item to 'grammarSuggestions' with:
        *   'originalChunk': The exact text segment with the error.
        *   'correctedChunk': The corrected version.
        *   'explanation': A **simple, non-technical explanation** in plain English. Example: User says "She go to market." Explanation: "You can say: 'She goes to the market.' We use 'goes' with 'she' when talking about present actions."
    *   If no such errors, set 'isGrammaticallyPerfect' to true. 'grammarSuggestions' can be empty or omitted.

    **B. Vocabulary Enhancement:**
    *   Look for opportunities to suggest stronger, more natural, or more precise vocabulary, even if the user's choice isn't strictly wrong.
    *   If you find such opportunities, add items to 'vocabularySuggestions' with:
        *   'originalWordOrPhrase': The user's word/phrase.
        *   'suggestedAlternative': Your improved suggestion.
        *   'reasonOrBenefit': Why it's better (e.g., "sounds more natural," "is more expressive"). Example: User says "I am very happy." Suggestion: "ecstatic". Reason: "'Ecstatic' means extremely happy and is more descriptive."
        *   'exampleSentences': (Optional) 1-2 examples of the suggested alternative in use.

    **C. Conversational Fluency Feedback:**
    *   Provide holistic feedback on how the user's message sounds in a conversation. Construct the 'fluencyFeedback' object:
        *   'clarityComment': Was the message easy to understand?
        *   'expressionComment': How natural did their phrasing sound?
        *   'toneComment': (Optional) Comment on politeness, friendliness, etc.
        *   'alternativePhrasing': If the sentence structure was awkward or could be significantly improved for fluency, suggest a more natural way to phrase it with a simple explanation. Example: User: "What you do yesterday?" AI Suggestion: "You could say: 'What did you do yesterday?' This sounds more natural for past questions because we use 'did'."
        *   'overallFluencyComment': A general remark on their conversational flow for this message.

    **D. Overall Encouraging Comment:**
    *   Provide an 'overallComment' that is encouraging and summarizes the feedback briefly. This should always be present.

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
          isGrammaticallyPerfect: true,
          overallComment: "Couldn't process feedback at this moment.",
        }
      };
    }
    // Ensure optional arrays are present if their parent object exists
    if (output.feedback) {
        if (output.feedback.isGrammaticallyPerfect && output.feedback.grammarSuggestions === undefined) {
            output.feedback.grammarSuggestions = [];
        }
        if (output.feedback.vocabularySuggestions === undefined) {
            output.feedback.vocabularySuggestions = [];
        }
    }
    return output;
  }
);

export async function continueConversation(input: ContinueConversationInput): Promise<ContinueConversationOutput> {
  return continueConversationFlow(input);
}

    