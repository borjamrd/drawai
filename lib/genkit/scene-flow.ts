import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { GoogleGenAI } from "@google/genai";
import { getSvgLibrary } from "@/lib/svg-library";

const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY });

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
  width_pct: z
    .number()
    .min(5)
    .max(100)
    .describe("Percentage of canvas width (800px) this asset should occupy (5–100)"),
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
    .map((a) => `- ${a.id} (default coverage: ${a.default_width_pct}%): ${a.description}`)
    .join("\n");
  return `You are a scene director for animated educational videos.

Your task: place visual elements on a canvas (800x450px) to illustrate an educational topic.

AVAILABLE ASSETS — use ONLY these exact IDs:
${assetList}

PLACEMENT RULES:
- x and y are percentages (0-100). Spread elements across the canvas. Avoid overlaps (keep at least 15 units apart).
- Typical positions: left side (x:15-25), center (x:45-55), right side (x:70-80). Top (y:20-35), middle (y:45-55), bottom (y:65-80).
- width_pct: percentage of the 800px canvas width the asset should visually cover.
  Use the asset's default coverage as a baseline. Adjust based on user intent:
  background/map filling canvas: 60–90%; prominent figure: 15–25%; small prop: 5–12%.
  If the user says "ocupe el 50%" or "casi todo el lienzo", translate that directly to width_pct.
- Layer order: elements are rendered in array order — first element = bottom layer, last = top layer.
  Place background assets first, foreground figures last.

TIMING RULES:
- First element: entry_time_ms = 0.
- Space subsequent entries 600-1200ms apart for dramatic effect.
- duration_ms should be last entry_time_ms + 2000.

OUTPUT RULES:
- Respond ONLY with valid JSON. No markdown fences, no explanation, no extra text.
- Only use library_id values from the list above. Never invent new IDs.`;
}

const ScenePlanItemSchema = z.object({
  title: z.string().describe("Short scene title (max 6 words, no punctuation)"),
  excerpt: z
    .string()
    .describe("Relevant fragment copied from the user's input that this scene covers"),
  key_concepts: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe(
      "2-3 concrete visual concepts to illustrate this scene — concrete nouns that can be drawn as SVG illustrations",
    ),
});

export const PresentationPlanSchema = z.object({
  title: z.string().describe("Short overall presentation title"),
  scenes: z
    .array(ScenePlanItemSchema)
    .min(1)
    .max(6)
    .describe("Ordered list of 2-6 scenes covering the input content"),
});

export type PresentationPlan = z.infer<typeof PresentationPlanSchema>;

const VisualDescriptionInputSchema = z.object({
  title: z.string(),
  excerpt: z.string(),
  key_concepts: z.array(z.string()),
});

const MissingAssetSchema = z.object({
  concept: z.string().describe("The concept that needs a new visual asset"),
  suggested_prompt: z
    .string()
    .describe(
      "Detailed image generation prompt for a minimalist line-art illustration of this concept",
    ),
  approved: z
    .boolean()
    .describe(
      "true = auto-generate (concrete, unambiguous concept); false = needs user approval (abstract or culturally variable)",
    ),
});

export const VisualDescriptionOutputSchema = z.object({
  visual_description: z
    .string()
    .describe("Explicit visual layout instructions in Spanish for the scene generator"),
  missing_assets: z
    .array(MissingAssetSchema)
    .describe("Concepts that have no suitable existing asset and must be created"),
});

export type VisualDescriptionOutput = z.infer<typeof VisualDescriptionOutputSchema>;

export const generateVisualDescriptionFlow = ai.defineFlow(
  {
    name: "generateVisualDescription",
    inputSchema: VisualDescriptionInputSchema,
    outputSchema: VisualDescriptionOutputSchema,
  },
  async (input) => {
    const library = getSvgLibrary();
    const assetList = library.map((a) => `- ${a.id}: ${a.description}`).join("\n");

    const { output } = await ai.generate({
      system: `You are a visual translator for animated educational scenes.

STEP 1 — ASSET MATCHING:
For each key concept, find the best matching asset from the available library.
If no suitable asset exists, add it to missing_assets.

AVAILABLE ASSETS:
${assetList}

STEP 2 — MISSING ASSETS:
For each unmatched concept, provide:
- concept: the concept name (slug-friendly, lowercase, no accents, e.g. "pueblo-espanol")
- suggested_prompt: detailed line-art illustration prompt for that concept
- approved: true if the concept is concrete and unambiguous (e.g. "barco", "libro", "persona")
             false if abstract or culturally variable (e.g. "democracia", "poder", "soberania")

STEP 3 — VISUAL DESCRIPTION:
Write 2-4 sentences in Spanish describing the scene layout.
- Reference existing assets by exact ID
- Reference missing assets by their concept slug (they will be generated before the scene renders)
- Describe position (izquierda, centro, derecha) and timing (al inicio, a los 2 segundos...)

OUTPUT: Respond ONLY with valid JSON matching the schema. No markdown, no explanation.`,
      prompt: `Escena: ${input.title}
Contenido: ${input.excerpt}
Conceptos visuales: ${input.key_concepts.join(", ")}`,
      output: { schema: VisualDescriptionOutputSchema },
    });
    return output!;
  },
);

export const planPresentationFlow = ai.defineFlow(
  {
    name: "planPresentation",
    inputSchema: z.string(),
    outputSchema: PresentationPlanSchema,
  },
  async (userInput) => {
    const { output } = await ai.generate({
      system: `You are a pedagogical content director for animated educational videos.

Your task: analyze the user's content and divide it into 2-6 coherent educational scenes.

RULES:
- Each scene must cover one clear conceptual unit
- Scenes must flow logically: chronological, thematic, or cause→effect
- excerpt: copy the most relevant fragment verbatim from the user's input (do not paraphrase)
  If the input is brief, the excerpt can be a short summary of what this scene covers
- key_concepts: 2-3 CONCRETE nouns that can be illustrated as SVG drawings
  Good: "corona", "libro de derecho", "pueblo", "balanza", "soldado", "bandera"
  Bad: "democracia" alone (too abstract), "principios" (not drawable)
  Exception: well-known symbolic abstractions are acceptable if they have an iconic visual form
  ("libertad" → figure with torch, "justicia" → scales and blindfold)
- title: short, descriptive, max 6 words, no punctuation
- Use between 2 and 6 scenes — as few as needed to cover the content clearly

OUTPUT: Respond ONLY with valid JSON. No markdown, no explanation, no extra text.`,
      prompt: userInput,
      output: { schema: PresentationPlanSchema },
    });
    return output!;
  },
);

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

export const enrichPromptFlow = ai.defineFlow(
  {
    name: "enrichPrompt",
    inputSchema: z.string(),
    outputSchema: z.string(),
  },
  async (prompt) => {
    const { text } = await ai.generate({
      system: `You are a visual prompt engineer for SVG illustration in "Thinking Line" style.
Enrich the user's vague description into a detailed visual prompt.
Add: pose/orientation, distinctive iconic physical features, historical/contextual clothing or accessories, scene context.
For recognizable historical figures, include their most iconic traits (hairstyle, facial hair, clothing era, expression).
Return ONLY the enriched prompt. One sentence. No explanation. No quotes.`,
      prompt,
    });
    return text.trim();
  },
);

const IMAGE_STYLE_PROMPT = `Hand-drawn black and white illustration. Pure white background (#FFFFFF), no color, no background scene.
Pen contour lines only — minimalist ink sketch, sparse deliberate strokes.
Realistic proportions. Single isolated subject, centered, full body visible.
Exactly one subject. No other figures, no duplicates, no background elements.
No shading, no gradients, no fills. Line art only. Strictly avoid any off-white or gray background colors.`;

export async function generateImageOptionsFlow(
  prompt: string,
): Promise<string[]> {
  const fullPrompt = `${IMAGE_STYLE_PROMPT}\nDraw exactly one: ${prompt}.`;
  const response = await genai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: fullPrompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: "512",
      },
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = response.candidates?.[0]?.content?.parts ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const imagePart = parts.find((p: any) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error("No image returned from model");
  }
  return [imagePart.inlineData.data as string];
}
