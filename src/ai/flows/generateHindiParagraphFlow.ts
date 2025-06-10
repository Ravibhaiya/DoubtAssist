
'use server';
/**
 * @fileOverview A Genkit flow to generate a wide variety of Hindi paragraphs for translation exercises.
 *
 * - generateHindiParagraph - Generates a Hindi paragraph with controllable difficulty, topic, and tone.
 * - GenerateHindiParagraphInput - Input type to control paragraph generation.
 * - GenerateHindiParagraphOutput - Output type: { hindiParagraph: string }.
 */

import { generate } from 'genkit/ai';
import { geminiPro } from 'genkitx/googleai'; // This might need to be googleAI() if geminiPro is not a direct export
import { z } from 'zod';
import {ai} from '@/ai/genkit'; 

// A more detailed input schema to allow for greater variety.
const GenerateHindiParagraphInputSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard'])
    .optional()
    .default('medium')
    .describe("The grammatical and lexical difficulty of the paragraph."),
  topic: z.string()
    .optional()
    .default('a general, everyday activity')
    .describe("The subject matter of the paragraph (e.g., 'the challenges of learning a new language', 'a trip to the market', 'the arrival of the monsoon')."),
  tone: z.enum(['neutral', 'narrative', 'descriptive', 'formal', 'informal'])
    .optional()
    .default('neutral')
    .describe("The writing style or tone of the paragraph."),
});
export type GenerateHindiParagraphInput = z.infer<typeof GenerateHindiParagraphInputSchema>;

const GenerateHindiParagraphOutputSchema = z.object({
  hindiParagraph: z.string().describe("A paragraph in Hindi (Devanagari script) matching the requested parameters."),
});
export type GenerateHindiParagraphOutput = z.infer<typeof GenerateHindiParagraphOutputSchema>;

// No longer using a statically defined prompt. The prompt is now built dynamically in the flow.

const generateHindiParagraphFlow = ai.defineFlow(
  {
    name: 'generateHindiParagraphFlow',
    inputSchema: GenerateHindiParagraphInputSchema,
    outputSchema: GenerateHindiParagraphOutputSchema,
  },
  async (input) => {
    // Dynamically build the prompt based on the input parameters.
    const prompt = `
      You are an AI assistant specialized in creating content for Hindi language learners.
      Your task is to generate a single, coherent paragraph in Hindi based on the following specifications.

      **Specifications:**
      - **Topic:** ${input.topic}
      - **Difficulty Level:** ${input.difficulty}
      - **Tone:** ${input.tone}
      - **Length:** Approximately 2 to 4 sentences.
      - **Script:** Must be exclusively in Devanagari script.

      **Guidelines for Difficulty:**
      - **Easy:** Use simple sentences, basic vocabulary, and primarily the present tense. Avoid complex conjunctions.
      - **Medium:** Use a mix of tenses (present, past, future), more varied vocabulary, and some compound sentences. Suitable for an intermediate learner.
      - **Hard:** Use complex sentence structures, including subordinate clauses, richer and more nuanced vocabulary, and potentially idiomatic expressions or abstract concepts.

      **Guidelines for Tone:**
      - **Narrative:** Tell a short story or describe a sequence of events.
      - **Descriptive:** Describe a person, place, or thing in detail.
      - **Formal:** Use polite and formal vocabulary and grammar (e.g., using 'आप' instead of 'तुम').
      - **Informal:** Use casual, conversational language (e.g., using 'तुम' or 'तू').
      - **Neutral:** A standard, informative tone.

      **IMPORTANT:**
      - Do NOT include any English text, romanization (Hinglish), or explanations in your response.
      - The entire output must be a single JSON object that strictly adheres to the provided output schema.
    `;

    const llmResponse = await ai.generate({ // Using ai.generate from the configured ai instance
      // model: geminiPro, // The model is typically configured in ai.ts, or can be specified here
      prompt: prompt,
      output: {
        schema: GenerateHindiParagraphOutputSchema,
      },
      config: {
        safetySettings: [
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
        temperature: 0.8,
      },
    });

    const output = llmResponse.output; // Correct for v1.x
    if (!output?.hindiParagraph) {
      return { hindiParagraph: "क्षमा करें, मैं अभी एक हिंदी अनुच्छेद उत्पन्न करने में असमर्थ हूँ।" };
    }

    return output;
  }
);

export async function generateHindiParagraph(input: GenerateHindiParagraphInput): Promise<GenerateHindiParagraphOutput> {
  const populatedInput = {
      difficulty: input.difficulty || 'medium',
      topic: input.topic || 'a general, everyday activity',
      tone: input.tone || 'neutral',
  };
  return generateHindiParagraphFlow(populatedInput);
}
