
'use server';
/**
 * @fileOverview A Genkit flow to generate a wide variety of Hindi paragraphs for translation exercises.
 *
 * - generateHindiParagraph - Generates a Hindi paragraph with controllable difficulty, topic, tone, and perspective.
 * - GenerateHindiParagraphInput - Input type to control paragraph generation.
 * - GenerateHindiParagraphOutput - Output type: { hindiParagraph: string }.
 */

import { z } from 'zod';
import {ai} from '@/ai/genkit'; // Assuming your custom AI configuration lives here

// Input schema is now even more powerful with the 'perspective' parameter.
const GenerateHindiParagraphInputSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard'])
    .optional()
    .default('medium')
    .describe("The grammatical and lexical difficulty of the paragraph."),
  topic: z.string()
    .optional()
    .default('a general, everyday scene or observation')
    .describe("The subject matter of the paragraph (e.g., 'the challenges of learning a new language', 'a trip to the market', 'the arrival of the monsoon')."),
  tone: z.enum(['neutral', 'narrative', 'descriptive', 'formal', 'informal'])
    .optional()
    .default('neutral')
    .describe("The writing style or tone of the paragraph."),
  perspective: z.enum(['first-person', 'second-person', 'third-person'])
    .optional()
    .default('third-person')
    .describe("The narrative point of view (e.g., 'I', 'you', 'he/she/they')."),
});
export type GenerateHindiParagraphInput = z.infer<typeof GenerateHindiParagraphInputSchema>;

const GenerateHindiParagraphOutputSchema = z.object({
  hindiParagraph: z.string().describe("A paragraph in Hindi (Devanagari script) matching the requested parameters."),
});
export type GenerateHindiParagraphOutput = z.infer<typeof GenerateHindiParagraphOutputSchema>;


const generateHindiParagraphFlow = ai.defineFlow(
  {
    name: 'generateHindiParagraphFlow',
    inputSchema: GenerateHindiParagraphInputSchema,
    outputSchema: GenerateHindiParagraphOutputSchema,
  },
  async (input) => {
    // The prompt is now dynamically built with even more detail.
    const prompt = `
      You are an AI assistant specialized in creating content for Hindi language learners.
      Your task is to generate a single, coherent paragraph in Hindi based on the following specifications.

      **Specifications:**
      - **Topic:** ${input.topic}
      - **Difficulty Level:** ${input.difficulty}
      - **Tone:** ${input.tone}
      - **Narrative Perspective:** ${input.perspective}
      - **Length:** Approximately 2 to 4 sentences.
      - **Script:** Must be exclusively in Devanagari script.

      **Guidelines for Narrative Perspective:**
      - **first-person:** Use a personal viewpoint ('मैं', 'हम'). Example: "मैं बाज़ार जा रहा था।"
      - **second-person:** Address the reader directly ('तुम', 'आप'). Example: "आपको नियमित रूप से व्यायाम करना चाहिए।"
      - **third-person:** Describe events or characters from an external, observational viewpoint ('वह', 'वे', 'यह', 'इसका'). This is for general narration and description. Example: "गाँव में सुबह जल्दी हो जाती है।"

      **Guidelines for Difficulty:**
      - **Easy:** Simple sentences, basic vocabulary, present tense.
      - **Medium:** Mix of tenses, more varied vocabulary, some compound sentences.
      - **Hard:** Complex sentence structures, subordinate clauses, nuanced vocabulary.

      **IMPORTANT:**
      - Strictly follow all specifications, especially the **Narrative Perspective**.
      - Do NOT include any English text, romanization, or explanations.
      - The entire output must be a single JSON object that adheres to the provided output schema.
    `;

    const llmResponse = await ai.generate({ // Using the global 'ai' instance
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

    const output = llmResponse.output; // Correct for Genkit 1.x
    if (!output?.hindiParagraph) {
      return { hindiParagraph: "क्षमा करें, मैं अभी एक हिंदी अनुच्छेद उत्पन्न करने में असमर्थ हूँ।" };
    }

    return output;
  }
);

export async function generateHindiParagraph(input: GenerateHindiParagraphInput): Promise<GenerateHindiParagraphOutput> {
  const populatedInput = {
      difficulty: input.difficulty || 'medium',
      topic: input.topic || 'a general, everyday scene or observation',
      tone: input.tone || 'neutral',
      perspective: input.perspective || 'third-person',
  };
  return generateHindiParagraphFlow(populatedInput);
}
