
'use server';
/**
 * @fileOverview A Genkit flow to generate a wide variety of Hindi paragraphs for translation exercises.
 *
 * - generateHindiParagraph - Generates diverse Hindi paragraphs with various styles, contexts, and linguistic features.
 * - GenerateHindiParagraphInput - Input type to control paragraph generation with enhanced variety.
 * - GenerateHindiParagraphOutput - Output type: { hindiParagraph: string }.
 */

import { z } from 'zod';
import {ai} from '@/ai/genkit'; // Assuming your custom AI configuration lives here

// Enhanced input schema with more variety controls
const GenerateHindiParagraphInputSchema = z.object({
  topic: z.string()
    .optional()
    .default('a general, everyday scene or observation')
    .describe("The subject matter of the paragraph (e.g., 'festival celebrations', 'urban life', 'nature and seasons', 'family traditions')."),
  
  tone: z.enum([
    'neutral', 'narrative', 'descriptive', 'formal', 'informal', 
    'conversational', 'poetic', 'journalistic', 'instructional', 
    'emotional', 'humorous', 'philosophical'
  ])
    .optional()
    .default('neutral')
    .describe("The writing style or tone of the paragraph."),
  
  perspective: z.enum(['first-person', 'second-person', 'third-person'])
    .optional()
    .default('third-person')
    .describe("The narrative point of view."),
  
  textType: z.enum([
    'story', 'description', 'dialogue', 'news', 'letter', 'diary', 
    'recipe', 'instruction', 'opinion', 'review', 'announcement', 
    'advertisement', 'proverb-explanation', 'biography'
  ])
    .optional()
    .default('description')
    .describe("The type or format of the text content."),
  
  linguisticFocus: z.enum([
    'simple-present', 'past-narrative', 'future-planning', 'conditional', 
    'compound-sentences', 'question-answer', 'comparative', 'causative', 
    'passive-voice', 'honorific-forms', 'colloquial-expressions', 'formal-register'
  ])
    .optional()
    .default('simple-present')
    .describe("Specific grammatical or linguistic features to emphasize."),
  
  culturalContext: z.enum([
    'traditional', 'modern', 'rural', 'urban', 'religious', 'secular', 
    'regional', 'pan-indian', 'professional', 'academic', 'domestic', 'social', 'general'
  ])
    .optional()
    .default('general')
    .describe("Cultural or social context for the content."),
  
  length: z.enum(['short', 'medium', 'long'])
    .optional()
    .default('medium')
    .describe("Length of the paragraph: short (2-3 sentences), medium (4-5 sentences), long (6-8 sentences)."),
  
  vocabulary: z.enum([
    'everyday', 'literary', 'technical', 'colloquial', 'formal', 
    'mixed', 'sanskrit-heavy', 'urdu-influenced', 'regional-flavor'
  ])
    .optional()
    .default('everyday')
    .describe("Type of vocabulary to emphasize in the paragraph.")
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
    const prompt = `
      You are an expert Hindi content creator specializing in generating diverse, authentic Hindi paragraphs for language learning and translation practice.
      
      Create a single, coherent paragraph in Hindi that incorporates ALL the following specifications:

      **Content Specifications:**
      - **Topic:** ${input.topic}
      - **Text Type:** ${input.textType}
      - **Tone:** ${input.tone}
      - **Narrative Perspective:** ${input.perspective}
      - **Cultural Context:** ${input.culturalContext}
      - **Length:** ${input.length}
      - **Vocabulary Style:** ${input.vocabulary}
      - **Linguistic Focus:** ${input.linguisticFocus}

      **Detailed Guidelines:**

      **Narrative Perspective Implementation:**
      - **first-person:** Use 'मैं', 'हम', 'मेरा', 'हमारा' - Express personal experiences, thoughts, and feelings
        Example: "मैं बाज़ार जा रहा था।", "हमने यह फिल्म देखी है।", "मेरे विचार से यह सही है।"
      - **second-person:** Use 'तुम', 'आप', 'तुम्हारा', 'आपका' - Address the reader directly, give advice, instructions
        Example: "आपको नियमित रूप से व्यायाम करना चाहिए।", "तुम्हें यह किताब पढ़नी चाहिए।", "आपका काम बहुत अच्छा है।"
      - **third-person:** Use 'वह', 'वे', 'उसका', 'उनका', 'यह', 'ये' - Describe events, characters, or situations from external viewpoint
        Example: "वह स्कूल जाता है।", "वे अपने काम में व्यस्त हैं।", "बच्चे पार्क में खेल रहे हैं।"

      **CRITICAL:** Maintain consistent perspective throughout the entire paragraph. Do not mix perspectives within the same paragraph.

      **Text Type Instructions:**
      - **story:** Create a narrative with beginning, development, and conclusion
      - **description:** Focus on vivid imagery and sensory details
      - **dialogue:** Include conversational exchanges with proper punctuation
      - **news:** Write in journalistic style with factual, objective tone
      - **letter:** Use appropriate greetings and formal/informal letter conventions
      - **diary:** Personal, reflective writing with intimate tone
      - **recipe/instruction:** Step-by-step procedural language
      - **opinion:** Argumentative or persuasive writing with viewpoints
      - **review:** Evaluative writing about experiences, products, or services
      - **announcement:** Formal declarative style for public information
      - **advertisement:** Persuasive, catchy language to promote something
      - **proverb-explanation:** Explain a Hindi proverb with context and meaning
      - **biography:** Descriptive account of someone's life or achievements

      **Linguistic Focus Implementation:**
      - **simple-present:** Use present tense verbs, habitual actions
      - **past-narrative:** Past tense storytelling with sequential events
      - **future-planning:** Future tense, intentions, predictions
      - **conditional:** Use 'अगर', 'यदि', conditional constructions
      - **compound-sentences:** Connect ideas with 'और', 'लेकिन', 'क्योंकि'
      - **question-answer:** Include rhetorical or direct questions
      - **comparative:** Use comparisons with 'से अधिक', 'की तरह'
      - **causative:** Show cause-effect relationships
      - **passive-voice:** Use passive constructions where appropriate
      - **honorific-forms:** Include respectful language forms
      - **colloquial-expressions:** Use everyday idioms and expressions
      - **formal-register:** Academic or official language style

      **Vocabulary Guidelines:**
      - **everyday:** Common, frequently used words
      - **literary:** Elevated, poetic expressions
      - **technical:** Subject-specific terminology
      - **colloquial:** Informal, conversational language
      - **formal:** Official, academic vocabulary
      - **mixed:** Balanced combination of different registers
      - **sanskrit-heavy:** Classical, traditional terminology
      - **urdu-influenced:** Include Urdu-origin words naturally
      - **regional-flavor:** Subtle regional expressions (specify which region if relevant)

      **Cultural Context Integration:**
      - **traditional:** Include customs, rituals, classical references
      - **modern:** Contemporary life, technology, current practices
      - **rural:** Village life, agriculture, traditional occupations
      - **urban:** City life, modern amenities, professional contexts
      - **religious:** Spiritual themes, festivals, religious practices
      - **secular:** Non-religious, inclusive content
      - **regional:** Specific geographical or cultural region
      - **professional:** Workplace, career, business contexts
      - **academic:** Educational, scholarly themes
      - **domestic:** Home, family, household activities
      - **social:** Community, relationships, social interactions

      **Length Specifications:**
      - **Short:** 2-3 well-developed sentences
      - **Medium:** 4-5 sentences with good flow and transitions
      - **Long:** 6-8 sentences forming a comprehensive paragraph

      **Quality Requirements:**
      - Use authentic, natural-sounding Hindi
      - Ensure grammatical accuracy and proper sentence structure
      - Include appropriate punctuation and formatting
      - Make content culturally relevant and contextually appropriate
      - Create engaging, meaningful content suitable for translation practice
      - Avoid repetitive sentence structures
      - Use varied vocabulary within the specified style
      - Ensure logical flow and coherence
      - **STRICTLY maintain the specified narrative perspective throughout the entire paragraph**
      - Use perspective-appropriate pronouns, verb forms, and sentence constructions
      - Ensure perspective consistency even when switching between different clauses or sentences

      **Output Requirements:**
      - Write ONLY in Devanagari script
      - NO English text, transliteration, or explanations
      - Return as a JSON object with the paragraph in the 'hindiParagraph' field
      - Strictly adhere to ALL specified parameters
    `;

    const llmResponse = await ai.generate({
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
        temperature: 0.9, // Increased for more creative variety
      },
    });

    const output = llmResponse.output;
    if (!output?.hindiParagraph) {
      return { hindiParagraph: "क्षमा करें, मैं अभी एक हिंदी अनुच्छेद उत्पन्न करने में असमर्थ हूँ।" };
    }

    return output;
  }
);

export async function generateHindiParagraph(input: GenerateHindiParagraphInput): Promise<GenerateHindiParagraphOutput> {
  const populatedInput = {
      topic: input.topic || 'a general, everyday scene or observation',
      tone: input.tone || 'neutral',
      perspective: input.perspective || 'third-person',
      textType: input.textType || 'description',
      linguisticFocus: input.linguisticFocus || 'simple-present',
      culturalContext: input.culturalContext || 'general',
      length: input.length || 'medium',
      vocabulary: input.vocabulary || 'everyday',
  };
  return generateHindiParagraphFlow(populatedInput);
}
