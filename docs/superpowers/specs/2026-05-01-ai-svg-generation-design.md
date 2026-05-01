# Design Spec: AI SVG Resource Generation

## Goal
Replace the manual SVG upload process in the "Crear Recurso" page with an AI-driven generation process that creates "hand-drawn" (handraw) style SVGs.

## Architecture

### 1. Genkit Flow (`lib/genkit/scene-flow.ts` or new file)
- **Flow Name**: `generateSvgOptionsFlow`
- **Model**: `gemini-2.5-flash`
- **Input**: `prompt: string`
- **Output**: `z.array(z.string())` (3 SVG code strings)
- **System Prompt**:
  ```text
  You are a professional minimalist illustrator specializing in "hand-drawn" (handraw) sketches.
  Your style:
  - Black and white only.
  - Transparent background.
  - Minimalist, single-stroke feel where possible.
  - Irregular, slightly wobbly lines to look like a human drawing.
  - Standard viewBox="0 0 100 100".
  - Clean SVG code without comments or extra tags.

  Generate 3 distinct visual variants for the user's prompt.
  Return ONLY a JSON array of 3 SVG strings.
  ```

### 2. API Route (`app/api/generate-asset/route.ts`)
- **Method**: POST
- **Body**: `{ prompt: string }`
- **Action**: Runs the Genkit flow and returns the 3 options.

### 3. UI Update (`app/recursos/crear-recurso/page.tsx`)
- **Prompt Input**: A text area/input for the user to describe the resource.
- **Generate Button**: Triggers the API call.
- **Selection Grid**: Shows 3 preview cards. Clicking one selects it.
- **Form Fields**: ID, Label, and Description remain but can be auto-filled from the prompt once an option is selected.
- **Action**: The "Guardar recurso" button sends the selected SVG code to the server action.

### 4. Server Action (`app/recursos/crear-recurso/actions.ts`)
- **Modify `createResource`**:
  - Accept `svgCode` (string) instead of `file` (File).
  - Save the string as a `.svg` file.

## Testing Strategy
1.  **Unit Test**: Verify Genkit flow returns valid SVG strings.
2.  **Integration Test**: Verify API route returns 3 options.
3.  **UI Test**: Verify prompt -> generate -> select -> save flow works end-to-end.

## Success Criteria
- User can describe an object (e.g., "un barco") and get 3 hand-drawn SVG options.
- The selected SVG is saved to the library and appears in `/recursos`.
- No file upload is required.
