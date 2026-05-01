# Spec: Sidebar & Local Resource Management

## 1. Overview
Introduce a global sidebar for navigation and a local resource management system that allows users to view and add SVG assets through the UI. Metadata will be persisted in a local JSON file, and SVG files will be stored in the public assets directory.

## 2. Architecture Changes

### 2.1 Navigation & Layout
- **Global Layout**: Update `app/layout.tsx` to wrap the application in a flex container with a fixed-width sidebar.
- **Sidebar Component**: A new component `components/Sidebar.tsx` (using Lucide icons) containing:
  - `Generador`: Link to `/`
  - `Biblioteca`: Link to `/recursos`
  - `Nuevo Recurso`: Link to `/recursos/crear-recurso`

### 2.2 Data Persistence
- **Metadata Storage**: `data/svg-library.json` will store the array of `SvgAsset` objects.
- **Asset Storage**: `public/assets/` will continue to store `.svg` files.
- **Library Interface**: `lib/svg-library.ts` will be updated to read from `data/svg-library.json` at runtime (using `fs` for server-side logic).

### 2.3 New Routes
- **`/recursos`**:
  - Displays a grid of existing SVG assets.
  - Each card shows the SVG preview, `label`, and `id`.
- **`/recursos/crear-recurso`**:
  - Form to upload a new SVG.
  - Fields: `id` (slug), `label`, `description`, and File Input (`.svg`).

## 3. Data Flow (Resource Creation)
1. User fills the form in `/recursos/crear-recurso`.
2. Form submits to a **Server Action** (`app/recursos/crear-recurso/actions.ts`).
3. Server Action:
   - Validates the `id` is unique.
   - Saves the file to `public/assets/[id].svg`.
   - Appends the entry to `data/svg-library.json`.
   - Triggers `revalidatePath('/recursos')`.
4. User is redirected to `/recursos`.

## 4. Testing & Validation
- **Navigation**: Verify clicking sidebar links changes the route and highlights the active item.
- **Creation**: Upload a new SVG and verify it appears in the gallery and is available for the AI generator.
- **Persistence**: Restart the server and verify the new asset is still present.
