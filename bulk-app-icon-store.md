# Bulk App Icon Store

## Overview
Create a new page/route (`/bulk-app-icon-store`) to process multiple image URLs in bulk. For each URL, the system will fetch the image, generate a 512x512 logo, remove the background to create a webp version, generate Android mipmap icons, and package everything into a domain-named ZIP file. The UI will include a textarea for input, a "Proceed" button to process all, and individual download buttons for each parsed URL.

## Project Type
WEB

## Success Criteria
- Users can paste multiple URLs into a textarea, separated by a newline.
- A "Proceed" button processes all URLs.
- The UI displays a list of the parsed URLs, each with its own individual "Download" button to process/download just that one.
- Processing handles each URL individually (assuming CORS is supported by the URLs).
- Fetches images, resizes to 512x512 (`logo.png`).
- Removes background and converts to WebP (80% quality) (`logo.webp`) using `@imgly/background-removal`.
- Reuses existing mipmap generator logic with 0% padding and white background.
- Downloads a single zip file per URL named `{domain}.zip` containing all assets (`logo.png`, `logo.webp`, and mipmap folders).
- UI is built with DaisyUI components.

## Tech Stack
- Framework: React (Vite) + TanStack Router
- UI: TailwindCSS v4 + DaisyUI v5
- Image Processing: Canvas API, `@imgly/background-removal`
- Zip: `jszip`

## File Structure
```text
src/
  routes/
    bulk-app-icon-store.tsx   (New route for the bulk processing UI)
  lib/
    bulkProcessing.ts         (Logic for orchestrating fetching, background removal, and zipping)
```

## Task Breakdown

### 1. Install Dependencies
- **Task ID**: `install-deps`
- **Agent**: `frontend-specialist`
- **Skills**: `app-builder`
- **Priority**: P0
- **Dependencies**: None
- **INPUT**: Run `pnpm add @imgly/background-removal`
- **OUTPUT**: Package installed in `package.json`
- **VERIFY**: Check `node_modules` and `package.json`.

### 2. Refactor `exportZip`
- **Task ID**: `refactor-zip`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: Modify `src/lib/exportZip.ts` so it can either return the `JSZip` instance/Blob instead of automatically downloading, OR accept a JSZip instance to populate. This allows us to inject `logo.png` and `logo.webp` into the same ZIP file before downloading.
- **OUTPUT**: Reusable mipmap zip generator.
- **VERIFY**: Ensure the original `/app-icon-maker` route still successfully downloads its ZIP.

### 3. Create Bulk Processing Logic Library
- **Task ID**: `bulk-logic`
- **Agent**: `frontend-specialist`
- **Skills**: `clean-code`
- **Priority**: P1
- **Dependencies**: `install-deps`, `refactor-zip`
- **INPUT**: Implement `src/lib/bulkProcessing.ts` exporting a function `processBulkImage(url)`. It will fetch the image, generate a 512x512 canvas, run `@imgly/background-removal` to create the webp, invoke the refactored `exportZip` logic to compile the assets, and trigger a download for `{domain}.zip`.
- **OUTPUT**: A robust library function that handles the full pipeline for a single URL.
- **VERIFY**: Function compiles with no TypeScript errors.

### 4. Create Bulk App Icon Store Route
- **Task ID**: `bulk-route`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P1
- **Dependencies**: None
- **INPUT**: Create `src/routes/bulk-app-icon-store.tsx` with a textarea for URLs and a "Proceed" button. Create a list/grid view below it to show the parsed URLs with individual "Download" buttons and status indicators (Pending, Processing, Done, Error). Use DaisyUI components (`textarea`, `btn btn-primary`).
- **OUTPUT**: New route accessible in the app.
- **VERIFY**: Navigate to the route and ensure UI renders correctly.

### 5. Wire UI to Logic
- **Task ID**: `wire-ui-logic`
- **Agent**: `frontend-specialist`
- **Skills**: `frontend-design`
- **Priority**: P2
- **Dependencies**: `bulk-logic`, `bulk-route`
- **INPUT**: Connect the "Proceed" button to process all URLs sequentially or in parallel, updating their individual statuses. Connect the individual "Download" buttons to process just that URL. Use `processBulkImage(url)`.
- **OUTPUT**: Functional bulk processor.
- **VERIFY**: Input a valid CORS-enabled image URL, click proceed or download, and verify the correct `{domain}.zip` is downloaded with the expected contents.

## Phase X: Verification
- [ ] Lint: `pnpm run lint`
- [ ] Build: `pnpm run build`
- [ ] Manual test: Process 2+ valid URLs and check the ZIP contents for `logo.png`, `logo.webp`, and mipmap folders.
