'use server';
/**
 * @fileOverview A Genkit flow to analyze an article by breaking it into sentences
 * and providing a simple explanation for each.
 *
 * - analyzeArticleSentences - Analyzes the article sentences.
 * - AnalyzeArticleSentencesInput - Input type: { articleContent: string }.
 * - AnalyzeArticleSentencesOutput - Output type: { analyses: Array<{ originalSentence: string, simpleExplanation: string }> }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const AnalyzeArticleSentencesInputSchema = z.object({
  articleContent: z.string().describe('The full text content of the article to be analyzed.'),
});
export type AnalyzeArticleSentencesInput = z.infer<typeof AnalyzeArticleSentencesInputSchema>;

const SentenceAnalysisSchema = z.object({
  originalSentence: z.string().describe('The original sentence from the article.'),
  simpleExplanation: z.string().describe('An explanation of the original sentence using simple English and vocabulary.'),
});

const AnalyzeArticleSentencesOutputSchema = z.object({
  analyses: z.array(SentenceAnalysisSchema).describe('An array of sentence analyses, each containing the original sentence and its simple explanation.'),
});
export type AnalyzeArticleSentencesOutput = z.infer<typeof AnalyzeArticleSentencesOutputSchema>;

const analyzeArticlePrompt = ai.definePrompt({
  name: 'analyzeArticleSentencesPrompt',
  input: {schema: AnalyzeArticleSentencesInputSchema},
  output: {schema: AnalyzeArticleSentencesOutputSchema},
  prompt: `You are an English language expert specializing in simplifying complex text for learners.
The user has provided an article. Your task is to:
1.  Carefully break the provided article text down into its individual, grammatically complete sentences.
2.  For EACH sentence, provide a clear and concise explanation of its meaning. This explanation MUST use simple English and everyday vocabulary. The goal is to make the sentence's meaning easy to grasp, especially for someone who might find the original wording a bit complex or nuanced.
3.  Focus on explaining what the sentence *means* rather than just rephrasing it slightly.
4.  Ensure your output is a JSON object strictly matching the specified output schema. It should contain an 'analyses' array, where each element is an object with 'originalSentence' and its corresponding 'simpleExplanation'.

Article Text:
'''
{{{articleContent}}}
'''

Provide your analysis in the specified JSON format.
`,
});

const analyzeArticleSentencesFlow = ai.defineFlow(
  {
    name: 'analyzeArticleSentencesFlow',
    inputSchema: AnalyzeArticleSentencesInputSchema,
    outputSchema: AnalyzeArticleSentencesOutputSchema,
  },
  async (input) => {
    if (!input.articleContent.trim()) {
      return { analyses: [] }; // Handle empty input gracefully
    }
    const {output} = await analyzeArticlePrompt(input);
    if (!output) {
      throw new Error('Failed to analyze article sentences. No output from AI model.');
    }
    return output;
  }
);

export async function analyzeArticleSentences(input: AnalyzeArticleSentencesInput): Promise<AnalyzeArticleSentencesOutput> {
  return analyzeArticleSentencesFlow(input);
}
