
'use server';
/**
 * @fileOverview A Genkit flow to initiate a conversation with the user.
 *
 * - startConversation - Generates an opening message from the AI.
 * - StartConversationInput - Input type (currently empty).
 * - StartConversationOutput - Output type: { openingMessage: string }.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const StartConversationInputSchema = z.object({
  // No input needed for the AI to pick a general topic for now
});
export type StartConversationInput = z.infer<typeof StartConversationInputSchema>;

const StartConversationOutputSchema = z.object({
  openingMessage: z.string().describe("The AI's opening line to start the conversation. This should be a natural, human-like conversation starter that feels spontaneous and relatable."),
});
export type StartConversationOutput = z.infer<typeof StartConversationOutputSchema>;

// Helper function to get current context for more natural conversation starters
function getCurrentTimeContext() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const month = now.getMonth();
  
  return {
    timeOfDay: hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening',
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
    isWeekend: day === 0 || day === 6,
    season: month < 3 || month === 11 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall'
  };
}

const startConversationPrompt = ai.definePrompt({
  name: 'startConversationPrompt',
  input: {schema: StartConversationInputSchema},
  output: {schema: StartConversationOutputSchema},
  prompt: `You are starting a natural conversation like a human would. Your goal is to create an opening that feels spontaneous, relatable, and authentic - as if you just had a thought or observation you wanted to share.

IMPORTANT GUIDELINES:
1. **Be conversational and natural** - Start as if you're continuing a thought or sharing something that just occurred to you
2. **Use human-like expressions** - Include casual phrases, mild hesitations, or natural speech patterns
3. **Make it relatable** - Reference common experiences, observations, or feelings people can connect with
4. **Vary your approach** - Sometimes share an observation, ask about experiences, mention something "interesting," or start with a relatable scenario
5. **Keep it genuine** - Avoid overly polished or formal language

CONVERSATION STARTER STYLES TO ROTATE BETWEEN:
- Personal observations: "You know what I was just thinking about..."
- Shared experiences: "I'm curious - do you ever..."
- Current moments: "It's one of those [time/weather/mood] kind of days..."
- Random thoughts: "Something crossed my mind earlier..."
- Relatable scenarios: "Have you ever noticed how..."
- Gentle curiosities: "I've been wondering lately..."

TOPICS TO DRAW FROM (but make them feel natural):
- Daily life quirks and observations
- Seasonal changes and weather moods
- Technology habits and digital life
- Food, cooking, or eating experiences
- Work-life balance thoughts
- Weekend or free time activities
- Learning new things or skills
- Social interactions and human behavior
- Simple pleasures or small frustrations
- Travel thoughts or local discoveries
- Creative pursuits or hobbies
- Life changes and personal growth

TONE EXAMPLES:
- "You know what's been on my mind lately? How..."
- "I had this random thought today about..."
- "Is it just me, or does anyone else..."
- "I've been noticing something interesting..."
- "There's something I've been curious about..."
- "I was just thinking - do you ever..."

Make each opening feel like it came from a real person having a genuine moment of connection or curiosity.

Current context: It's ${getCurrentTimeContext().timeOfDay} on a ${getCurrentTimeContext().dayOfWeek} in ${getCurrentTimeContext().season}.

Respond with a single JSON object matching the specified output schema. Do not add any conversational text outside the JSON.`,
});

const startConversationFlow = ai.defineFlow(
  {
    name: 'startConversationFlow',
    inputSchema: StartConversationInputSchema,
    outputSchema: StartConversationOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await startConversationPrompt(input);
      if (!output) {
        return getRandomFallbackMessage();
      }
      return output;
    } catch (error) {
      console.error('Error in startConversationFlow:', error);
      return getRandomFallbackMessage();
    }
  }
);

// Human-like fallback messages for when the AI prompt fails
function getRandomFallbackMessage(): StartConversationOutput {
  const timeContext = getCurrentTimeContext();
  
  const fallbackMessages = [
    "You know what I was just thinking about? How we all have those little daily routines that somehow make us feel more organized, even when everything else feels chaotic.",
    `It's ${timeContext.timeOfDay} and I'm curious - what's one small thing that's been on your mind lately?`,
    "I had this random thought earlier about how we're all just figuring things out as we go along. Do you ever feel that way?",
    "Is it just me, or does anyone else have those moments where you discover something new about yourself completely by accident?",
    `${timeContext.isWeekend ? 'Weekend' : 'Weekday'} vibes got me thinking - what's something you've been wanting to try but haven't quite gotten around to yet?`,
    "I've been noticing how people have such different relationships with technology. Some love the latest gadgets, others prefer keeping things simple. Where do you fall on that spectrum?",
    "There's something fascinating about how we all have different ways of unwinding after a long day. What works for you?"
  ];
  
  const randomIndex = Math.floor(Math.random() * fallbackMessages.length);
  return { openingMessage: fallbackMessages[randomIndex] };
}

export async function startConversation(input: StartConversationInput): Promise<StartConversationOutput> {
  return startConversationFlow(input);
}
