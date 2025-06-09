
'use server';
/**
 * @fileOverview A Genkit flow to generate a random Hindi paragraph for translation exercises.
 *
 * - generateHindiParagraph - Generates a Hindi paragraph.
 * - GenerateHindiParagraphInput - Input type (currently empty).
 * - GenerateHindiParagraphOutput - Output type: { hindiParagraph: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateHindiParagraphInputSchema = z.object({
  // Future extension: difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
});
export type GenerateHindiParagraphInput = z.infer<typeof GenerateHindiParagraphInputSchema>;

const GenerateHindiParagraphOutputSchema = z.object({
  hindiParagraph: z.string().describe("A medium-length paragraph in Hindi (Devanagari script), typically 2-4 sentences long, covering varied tenses and grammatical structures. The paragraph should be on a general, everyday topic."),
});
export type GenerateHindiParagraphOutput = z.infer<typeof GenerateHindiParagraphOutputSchema>;

const generateHindiParagraphPrompt = ai.definePrompt({
  name: 'generateHindiParagraphPrompt',
  input: {schema: GenerateHindiParagraphInputSchema},
  output: {schema: GenerateHindiParagraphOutputSchema},
  prompt: `You are an AI assistant tasked with generating content for language learning exercises.
Your goal is to create a random, medium-length paragraph in Hindi.
The paragraph should:
- Be written in Devanagari script.
- Be approximately 2 to 4 sentences long.
- Cover a general, everyday topic (e.g., daily activities, weather, hobbies, a short observation).
- Use a variety of tenses and grammatical structures suitable for an intermediate learner.
- Be natural and coherent.

Example topics: a person describing their morning routine, a comment about the current season, a brief thought about a recent event, plans for the weekend.
Do not include any English text or explanations. Only provide the Hindi paragraph.

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

const generateHindiParagraphFlow = ai.defineFlow(
  {
    name: 'generateHindiParagraphFlow',
    inputSchema: GenerateHindiParagraphInputSchema,
    outputSchema: GenerateHindiParagraphOutputSchema,
  },
  async (input) => {
    const {output} = await generateHindiParagraphPrompt(input);
    if (!output) {
      // Fallback in case of unexpected empty output
      return { hindiParagraph: "क्षमा करें, मैं अभी एक हिंदी अनुच्छेद उत्पन्न करने में असमर्थ हूँ।" };
    }
    return output;
  }
);

export async function generateHindiParagraph(input: GenerateHindiParagraphInput): Promise<GenerateHindiParagraphOutput> {
  return generateHindiParagraphFlow(input);
}
