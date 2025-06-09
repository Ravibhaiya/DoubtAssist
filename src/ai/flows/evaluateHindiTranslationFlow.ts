
'use server';
/**
 * @fileOverview A Genkit flow to evaluate a user's English translation of a Hindi paragraph.
 *
 * - evaluateHindiTranslation - Evaluates the translation and provides feedback.
 * - EvaluateTranslationInput - Input type: { originalHindiParagraph: string, userEnglishTranslation: string }.
 * - EvaluateTranslationOutput - Output type: { isTranslationAccurate: boolean, feedbackSummary: string, detailedFeedbackItems?: ... }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const EvaluateTranslationInputSchema = z.object({
  originalHindiParagraph: z.string().describe("The original Hindi paragraph in Devanagari script."),
  userEnglishTranslation: z.string().describe("The user's attempted English translation of the Hindi paragraph."),
});
export type EvaluateTranslationInput = z.infer<typeof EvaluateTranslationInputSchema>;

const DetailedFeedbackItemSchema = z.object({
  originalHindiSegment: z.string().optional().describe("The specific segment of the Hindi text being referenced for feedback. This might be a word or a short phrase."),
  userTranslationSegment: z.string().optional().describe("The corresponding segment of the user's English translation that contains an error or could be improved."),
  suggestedCorrection: z.string().describe("The suggested correct English translation or improvement for the segment."),
  explanation: z.string().describe("A clear explanation of the error and correction, covering grammar (e.g., tense, prepositions, articles, word order), vocabulary choice, or sentence structure. Aim for simplicity and clarity."),
  errorType: z.enum(['grammar', 'vocabulary', 'sentence_structure', 'meaning_accuracy', 'style']).optional().describe("The primary type of error or area for improvement."),
});

const EvaluateTranslationOutputSchema = z.object({
  isTranslationAccurate: z.boolean().describe("An overall assessment of whether the user's translation is largely accurate and conveys the core meaning of the original Hindi. True if mostly correct, false if significant errors exist."),
  feedbackSummary: z.string().describe("A brief, encouraging summary of the feedback. For example, 'Good effort! A few areas to work on...' or 'Excellent translation!'."),
  detailedFeedbackItems: z.array(DetailedFeedbackItemSchema).optional().describe("An array of specific feedback items if errors or areas for improvement are found. If the translation is perfect, this can be empty or omitted."),
});
export type EvaluateTranslationOutput = z.infer<typeof EvaluateTranslationOutputSchema>;

const evaluateTranslationPrompt = ai.definePrompt({
  name: 'evaluateHindiTranslationPrompt',
  input: {schema: EvaluateTranslationInputSchema},
  output: {schema: EvaluateTranslationOutputSchema},
  prompt: `You are an expert bilingual AI (Hindi-English) language tutor. Your task is to evaluate a user's English translation of a given Hindi paragraph.

Original Hindi Paragraph:
'''
{{{originalHindiParagraph}}}
'''

User's English Translation:
'''
{{{userEnglishTranslation}}}
'''

Carefully compare the user's translation with the original Hindi text. Your evaluation should focus on:
1.  **Accuracy of Meaning**: Does the translation correctly convey the meaning of the Hindi text?
2.  **Grammar**: Are there any grammatical errors in the English translation (e.g., tense, subject-verb agreement, articles, prepositions, word order)?
3.  **Vocabulary Choice**: Is the English vocabulary appropriate and natural for the context? Are there better word choices?
4.  **Sentence Structure**: Is the English sentence structure correct and natural?

Based on your analysis, provide feedback in the specified JSON format:
-   \`isTranslationAccurate\`: Set to \`true\` if the translation is largely correct and captures the main essence, even with minor imperfections. Set to \`false\` if there are significant errors in meaning, grammar, or structure.
-   \`feedbackSummary\`: Provide a brief, encouraging overall comment.
-   \`detailedFeedbackItems\`: If there are errors or areas for improvement:
    *   Create an item for each significant error or suggestion.
    *   \`originalHindiSegment\`: (Optional, but highly recommended) The specific word or short phrase from the Hindi paragraph related to the feedback.
    *   \`userTranslationSegment\`: (Optional) The corresponding segment from the user's translation that is incorrect or could be improved.
    *   \`suggestedCorrection\`: Provide the corrected English version for that segment.
    *   \`explanation\`: Clearly explain why it's an error and how the correction improves it. Be specific about grammar rules, vocabulary nuances, or structural issues.
    *   \`errorType\`: Classify the error (e.g., 'grammar', 'vocabulary').
    *   If the translation is perfect, \`detailedFeedbackItems\` can be an empty array or omitted.

Strive to provide constructive and easy-to-understand feedback.

Respond with a single JSON object matching the specified output schema.
`,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
    ],
  },
});

const evaluateHindiTranslationFlow = ai.defineFlow(
  {
    name: 'evaluateHindiTranslationFlow',
    inputSchema: EvaluateTranslationInputSchema,
    outputSchema: EvaluateTranslationOutputSchema,
  },
  async (input) => {
    // Basic input validation (more can be added)
    if (!input.originalHindiParagraph.trim() || !input.userEnglishTranslation.trim()) {
      return {
        isTranslationAccurate: false,
        feedbackSummary: "Input error: Original Hindi paragraph and user translation cannot be empty.",
        detailedFeedbackItems: [],
      };
    }

    const {output} = await evaluateTranslationPrompt(input);
    
    if (!output) {
      return {
        isTranslationAccurate: false,
        feedbackSummary: "Sorry, I encountered an issue evaluating the translation. Please try again.",
        detailedFeedbackItems: [],
      };
    }
    // Ensure detailedFeedbackItems is an array if not present, especially if isTranslationAccurate is false
    if (!output.isTranslationAccurate && !output.detailedFeedbackItems) {
        output.detailedFeedbackItems = [];
    }
    if (output.isTranslationAccurate && output.detailedFeedbackItems === undefined) {
        output.detailedFeedbackItems = [];
    }


    return output;
  }
);

export async function evaluateHindiTranslation(input: EvaluateTranslationInput): Promise<EvaluateTranslationOutput> {
  return evaluateHindiTranslationFlow(input);
}
