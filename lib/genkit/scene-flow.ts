import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { getSvgLibrary } from "@/lib/svg-library";

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model("gemini-3-flash-preview"),
});

export const SceneElementSchema = z.object({
  library_id: z
    .string()
    .describe("ID of the SVG asset from the available assets list"),
  x: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Horizontal position as percentage of canvas width (0=left, 100=right)",
    ),
  y: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Vertical position as percentage of canvas height (0=top, 100=bottom)",
    ),
  scale: z
    .number()
    .positive()
    .describe("Size multiplier: 1.0 = normal, 0.5 = half, 1.5 = larger"),
  entry_time_ms: z
    .number()
    .nonnegative()
    .describe("Milliseconds from scene start when this element appears"),
  entry_effect: z
    .enum(["fade", "slide_left", "slide_right", "slide_up", "zoom", "bounce"])
    .describe("Animation effect when the element enters the canvas"),
});

export const SceneSchema = z.object({
  title: z.string().describe("Short descriptive title for the scene"),
  duration_ms: z
    .number()
    .positive()
    .describe("Total scene duration in milliseconds"),
  elements: z
    .array(SceneElementSchema)
    .describe("Ordered list of visual elements to place on the canvas"),
});

export type Scene = z.infer<typeof SceneSchema>;

function buildSystemPrompt(): string {
  const assetList = getSvgLibrary()
    .map((a) => `- ${a.id}: ${a.description}`)
    .join("\n");
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
- Only use library_id values from the list above. Never invent new IDs.`;
}

export const generateSceneFlow = ai.defineFlow(
  {
    name: "generateScene",
    inputSchema: z.string(),
    outputSchema: SceneSchema,
  },
  async (userPrompt) => {
    const { output } = await ai.generate({
      prompt: `${buildSystemPrompt()}\n\nUser request: ${userPrompt}`,
      output: { schema: SceneSchema },
    });
    return output!;
  },
);

export const generateSvgOptionsFlow = ai.defineFlow(
  {
    name: "generateSvgOptions",
    inputSchema: z.string(),
    outputSchema: z.array(z.string()),
  },
  async (prompt) => {
    const { output } = await ai.generate({
      system: `You are an elite SVG Architect and illustrator specializing in the "Thinking Line" art style and minimally realistic contour sketches. Your task is to translate concepts into expressive, hand-drawn style SVG code.

### 1. ARTISTIC STYLE & PHILOSOPHY ("THINKING LINE" & MINIMAL REALISM)
- Minimally Realistic: Do NOT make it abstract or cartoonish. The drawing must clearly and accurately depict realistic anatomical features, proportions, and structural details (e.g., eyes, cheekbones, feathers, hair), but achieved through sparse, deliberate line work.
- "Thinking Line" Technique: Use flowing, continuous-feeling contour lines that explore the form and volume of the subject. Imagine a skilled artist sketching a live model with an ink pen, where lines occasionally overlap or flow into one another to build realistic structure without dense shading.
- Organic & Expressive: Capture the essence of realism with an elegant, expressive touch. Use bezier curves to mimic the organic, slightly imperfect stroke of a human hand sketching on paper.

### 2. STRICT TECHNICAL SVG RULES
- Wrapper: MUST use standard <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">.
- Allowed tags: Limit strictly to <path>, <circle>, <ellipse>, or <polyline>.
- Styling Mandate: Every single element MUST include: fill="none" stroke="#1a1a1a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round". (Note: stroke-width is strictly 1 to allow for finer realistic details).
- The "No-Fill" Rule: NEVER use fill="black" or any colored fill, except for tiny isolated details like pupils of an eye (e.g., <circle cx="50" cy="50" r="0.8" fill="#1a1a1a" />).
- Coordinate Math: Ensure the \`d\` attribute in paths accurately maps out realistic proportions within the 100x100 canvas. Avoid chaotic zig-zags; use smooth curves (C, Q, S) to render organic realistic shapes.

### 3. TASK
- Generate 3 distinctly different visual variants of the user's prompt (e.g., Variant 1: Side profile; Variant 2: Three-quarter view; Variant 3: Detailed front view).
- Each string in your response array must contain ONLY the raw, valid inline <svg> code for one variant.`,
      prompt: prompt,
      output: { schema: z.array(z.string()) },
    });
    return output!;
  },
);
