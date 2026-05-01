import { genkit, z } from 'genkit'
import { googleAI } from '@genkit-ai/google-genai'
import { SVG_LIBRARY } from '@/lib/svg-library'

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
})

export const SceneElementSchema = z.object({
  library_id: z.string().describe('ID of the SVG asset from the available assets list'),
  x: z.number().min(0).max(100).describe('Horizontal position as percentage of canvas width (0=left, 100=right)'),
  y: z.number().min(0).max(100).describe('Vertical position as percentage of canvas height (0=top, 100=bottom)'),
  scale: z.number().positive().describe('Size multiplier: 1.0 = normal, 0.5 = half, 1.5 = larger'),
  entry_time_ms: z.number().nonnegative().describe('Milliseconds from scene start when this element appears'),
  entry_effect: z
    .enum(['fade', 'slide_left', 'slide_right', 'slide_up', 'zoom', 'bounce'])
    .describe('Animation effect when the element enters the canvas'),
})

export const SceneSchema = z.object({
  title: z.string().describe('Short descriptive title for the scene'),
  duration_ms: z.number().positive().describe('Total scene duration in milliseconds'),
  elements: z.array(SceneElementSchema).describe('Ordered list of visual elements to place on the canvas'),
})

export type Scene = z.infer<typeof SceneSchema>

function buildSystemPrompt(): string {
  const assetList = SVG_LIBRARY.map((a) => `- ${a.id}: ${a.description}`).join('\n')
  return `You are a scene director for animated educational videos.

Your task: place visual elements on a canvas (800x450px) to illustrate an educational topic.

AVAILABLE ASSETS — use ONLY these exact IDs:
${assetList}

PLACEMENT RULES:
- x and y are percentages (0-100). Spread elements across the canvas. Avoid overlaps (keep at least 15 units apart).
- Typical positions: left side (x:15-25), center (x:45-55), right side (x:70-80). Top (y:20-35), middle (y:45-55), bottom (y:65-80).
- scale: 1.0 normal, 0.7-0.9 smaller/background, 1.2-1.4 emphasized/foreground.

TIMING RULES:
- First element: entry_time_ms = 0.
- Space subsequent entries 600-1200ms apart for dramatic effect.
- duration_ms should be last entry_time_ms + 2000.

OUTPUT RULES:
- Respond ONLY with valid JSON. No markdown fences, no explanation, no extra text.
- Only use library_id values from the list above. Never invent new IDs.`
}

export const generateSceneFlow = ai.defineFlow(
  {
    name: 'generateScene',
    inputSchema: z.string(),
    outputSchema: SceneSchema,
  },
  async (userPrompt) => {
    const { output } = await ai.generate({
      prompt: `${buildSystemPrompt()}\n\nUser request: ${userPrompt}`,
      output: { schema: SceneSchema },
    })
    return output!
  }
)
