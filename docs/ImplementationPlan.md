# Technical Implementation Plan (v0.1)

This plan outlines the development blocks for the 21st Gen IDE, based on the shared understanding and target technologies.

**Phase 1: Core Infrastructure, Basic Editor & Public GitHub Repo Loading**

*   **Goal:** Establish foundational web app structure, basic editor, and load initial code from a *public* GitHub repository URL.
*   **Tasks:**
    *   Set up the project (React/Next.js, build system).
    *   Configure Tailwind CSS with custom design tokens (e.g., colors, spacing, typography based on design specs).
    *   Set up Radix UI or a similar headless UI library for accessible components.
    *   Create basic shared UI components (e.g., Button, Input) wrapping Radix primitives and styled with Tailwind.
    *   Implement the basic UI shell, including a single input field for a public GitHub repository URL.
    *   **Public GitHub Repo Workflow:**
        *   **URL Input:** When a user pastes a public GitHub URL and proceeds:
            *   Parse the URL to extract owner, repository name, and optionally branch/tag/commit SHA.
        *   **Fetching Repo Content (GitHub API - Unauthenticated):**
            *   Use the GitHub REST API (e.g., via `fetch` or `octokit/rest.js`, *without authentication*) to:
                *   Determine the target branch/commit (use default branch if not specified in URL).
                *   Fetch the Git tree for the target branch/commit.
                *   Fetch the content (blob) for each relevant file in the tree.
        *   Prepare the fetched files in the `FileSystemTree` format expected by WebContainer's `mount` method (for Phase 2).
        *   *(Note: Authentication, private repos, and branching will be added in a later phase).* 
    *   Integrate a standard web-based code editor component (e.g., Monaco Editor, likely within `src/components/code/Editor.tsx`).
    *   Implement basic file reading capabilities (reading from the structure fetched from GitHub).
    *   Configure necessary headers (COOP/COEP) for WebContainer compatibility.
*   **Technologies:** React/Next.js, Monaco Editor (or similar), Node.js (for build/dev), GitHub REST API (`fetch` or `octokit/rest.js`), Tailwind CSS, Radix UI.

**Phase 2: WebContainer Integration & File System**

*   **Goal:** Integrate WebContainers to run a Node.js environment within the browser and manage a virtual file system.
*   **Tasks:**
    *   Integrate the WebContainer API.
    *   Boot a WebContainer instance on application load (potentially managed in `src/context/WebContainerContext.tsx` and `src/hooks/useWebContainer.ts`).
    *   Implement file system operations (`mount`, `readFile`, `writeFile`, `mkdir`, `rm`) using the WebContainer fs API (likely in `src/lib/container/filesystem.ts` and utilized by `src/hooks/useFileSystem.ts`).
    *   Adapt the editor (`src/components/code/Editor.tsx`) to read/write files within the WebContainer's virtual file system.
    *   Set up basic project structure loading (e.g., mounting sample files/folders).
*   **Technologies:** WebContainer API (`@webcontainer/api`).

**Phase 3: Tree-sitter Integration & JavaScript AST Analysis**

*   **Goal:** Integrate Tree-sitter (`web-tree-sitter`) for parsing JavaScript code within the WebContainer and enabling AST traversal and analysis.
*   **Tasks:**
    *   Integrate the `web-tree-sitter` library into the frontend application.
    *   Load the pre-compiled Tree-sitter JavaScript grammar (`/public/wasm/tree-sitter/tree-sitter-javascript.wasm`) using `Language.load()`.
    *   Initialize a `Parser` instance and set its language to the loaded JavaScript grammar (`parser.setLanguage(JavaScript)`) (likely within `src/lib/ast/parser.ts`).
    *   On file load/edit within the WebContainer (Phase 2), read the file content and parse it using `parser.parse(sourceCode)`. Store the resulting `Tree` object (managed by `src/hooks/useAst.ts`).
    *   Implement AST traversal logic (e.g., in `src/lib/ast/traversal.ts`, `src/lib/ast/reactComponentUtils.ts`).
    *   Develop utility functions for common AST queries (e.g., find all function declarations, find imports/exports, find specific variable assignments).
    *   Use AST analysis for initial features like populating the file structure view (Phase 4) or providing basic code intelligence (e.g., identifying component boundaries).
    *   Handle incremental parsing: When the code is edited, use `tree.edit(...)` with the change details and then call `parser.parse(newSourceCode, oldTree)` to efficiently update the AST.
*   **Technologies:** `web-tree-sitter`, `tree-sitter-javascript` grammar, WebContainer API (for file content).

**Phase 4: Design Mode - Component Preview via Isolated Vite App**

*   **Goal:** Render a live, interactive preview of the user-selected React component within an isolated Vite environment running inside the WebContainer, using a dynamically generated map of components.
*   **Tasks:**
    *   **User Project Mounting:** Ensure the user's cloned GitHub repository is mounted into a designated subfolder within the WebContainer's filesystem, e.g., `/project`. (Refinement of Phase 1/2).
        ```typescript
        // Example: After getting GitHub URL/content
        await webcontainerInstance.mount({
          '/project': { directory: true } // Mount user's repo into /project
          // ... potentially mount user files here if fetched individually
        });
        ```
    *   **Component Map Generation (Dynamic):**
        *   **File Discovery:** Implement logic (e.g., using Node `fs` within WebContainer) to find all relevant component files (`.tsx`, `.jsx`) within the mounted `/project/src` directory (similar to `findTSXFiles` example).
        *   **AST Parsing & Export Extraction:** For each discovered component file:
            *   Read the file content using `webcontainerInstance.fs.readFile()`.
            *   Parse the content using Tree-sitter (`web-tree-sitter`, Phase 3 parser).
            *   Traverse the AST to identify the `default export` (function name, class name, or identifier). Handle anonymous exports by potentially using the filename as a fallback.
        *   **Build Map:** Construct a JavaScript object (`componentMap`) mapping the identified default export names to their corresponding file paths relative to `/project/src`.
            ```javascript
            // Example componentMap
            const componentMap = {
              "HomePage": "pages/HomePage.tsx",
              "ButtonComponent": "components/ButtonComponent.tsx",
              // ... dynamically generated entries
            };
            ```
    *   **Preview App Injection:** Programmatically create a separate directory structure for the minimal preview application within the WebContainer, e.g., `/preview-app`.
        *   Use `webcontainerInstance.fs.mkdir('/preview-app')` and `webcontainerInstance.fs.writeFile()` to create the necessary structure and files:
            *   `/preview-app/vite.config.ts` (similar to before, with alias)
            *   `/preview-app/src/componentMap.js` (**NEW:** Write the dynamically generated `componentMap` here)
            *   `/preview-app/src/PreviewLoader.tsx` (**MODIFIED:** Simpler loader using the map)
            *   `/preview-app/src/main.tsx` (Standard React entry point)
            *   `/preview-app/index.html` (Basic HTML shell)
            *   `/preview-app/tsconfig.json` & `/preview-app/tsconfig.node.json` (Standard TS configs)
            *   `/preview-app/package.json` (Minimal definition)
        *   **File Contents:**
            *   **`/preview-app/vite.config.ts`:** (Same as before, defines alias `@user-project` to `/project/src`)
                ```typescript
                import { defineConfig } from 'vite';
                import react from '@vitejs/plugin-react';

                export default defineConfig({
                  plugins: [react()],
                  resolve: {
                    alias: {
                      '@user-project': '/project/src', // Alias to user project src
                    }
                  },
                  server: {
                    port: 5173, // Or another available port
                  }
                });
                ```
            *   **`/preview-app/src/componentMap.js` (Generated):**
                ```javascript
                // This file is generated dynamically
                export const componentMap = {
                  "HomePage": "pages/HomePage.tsx",
                  "ButtonComponent": "components/ButtonComponent.tsx",
                  // ... other detected components
                };
                ```
            *   **`/preview-app/src/PreviewLoader.tsx` (New Logic):** Implement dynamic component loading based on `componentName` URL query parameter and the `componentMap`.
                ```typescript
                import { lazy, Suspense } from 'react';
                import { useSearchParams, BrowserRouter } from 'react-router-dom';
                import { componentMap } from './componentMap'; // Import the generated map

                function DynamicComponentLoader() {
                  const [params] = useSearchParams();
                  const componentName = params.get('componentName'); // e.g., 'ButtonComponent'

                  if (!componentName) {
                    return <div>Error: No component name provided (?componentName=...).</div>;
                  }

                  const relativePath = componentMap[componentName];

                  if (!relativePath) {
                    return <div>Error: Component '{componentName}' not found in map.</div>;
                  }

                  // Construct the aliased import path. REMOVE .tsx/.jsx if needed by vite/lazy
                  // Vite/React need the extensionless path for dynamic imports usually.
                  const importPath = `@user-project/${relativePath.replace(/\.(tsx|jsx)$/, '')}`;

                  // Use React.lazy for dynamic import
                  const Component = lazy(() => import(/* @vite-ignore */ importPath));

                  return (
                    <Suspense fallback={<div>Loading Preview...</div>}>
                      <Component />
                    </Suspense>
                  );
                }

                // Wrapper component providing Router context
                export default function PreviewLoader() {
                  return (
                    <BrowserRouter>
                      <DynamicComponentLoader />
                    </BrowserRouter>
                  );
                }
                ```
            *   **`/preview-app/src/main.tsx`:** (Same as before)
            *   **`/preview-app/index.html`:** (Same as before)
            *   **`/preview-app/tsconfig.json`:** (Same as before, ensure paths alias matches)
            *   **`/preview-app/tsconfig.node.json`:** (Same as before)
            *   **`/preview-app/package.json`:** (Same as before)
    *   **Install Dependencies:** Use `webcontainerInstance.spawn` to run commands within the `/preview-app` directory (Same as before):
        *   `npm install react react-dom react-router-dom`
        *   `npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/react-router-dom`
    *   **Boot Preview Server:** Use `webcontainerInstance.spawn` to start the Vite development server within `/preview-app` (Same as before). Store the URL.
    *   **Iframe Integration:**
        *   Create a component (e.g., `src/components/preview/ComponentPreview.tsx`) that renders an `<iframe>`.
        *   This component should use the `useFileSelection` hook to get the `selectedPath`.
        *   **Map Path to Component Name:** When `selectedPath` points to a component file, use the inverse of the `componentMap` (or generate an inverse map) to find the corresponding `componentName`.
        *   Construct the iframe `src` attribute using the stored Vite server URL and the component name as the query parameter: `VITE_URL/?componentName=ComponentName`.
        *   Update the `iframe.src` when the resolved `componentName` changes.
        *   Handle cases where the selected file doesn't have a default export or the Vite server isn't ready.
    *   **Hot Module Replacement (HMR):** (Same as before) Rely on Vite's built-in HMR. Changes saved via `webcontainerInstance.fs.writeFile()` should trigger updates. Consider rebuilding the `componentMap` if file structure changes significantly or on user request.
*   **Technologies:** WebContainer API (`mount`, `spawn`, `fs`), Vite, React, `react-router-dom`, TypeScript, **Tree-sitter (`web-tree-sitter`)**.

**Phase 5: Code ↔ Design Sync & Inspector (AST & WebSocket)**

*   **Goal:** Establish real-time, two-way synchronization between the Code Editor and the Design Mode canvas using WebSockets, and implement the Inspector panel powered by AST analysis.
*   **Tasks (AST Interaction & Inspector):**
    *   **Selection Mapping:** When a node is selected on the Design canvas (`src/components/design/Canvas.tsx`), identify the corresponding code fragment and locate the primary AST node(s) associated with it using source map information or character ranges derived during the AST-to-Canvas translation (`src/lib/ast/mapper.ts`).
    *   **Inspector Population:** Develop the Inspector panel UI (`src/components/design/Inspector.tsx`). On node selection, use the identified AST node(s) to:
        *   Traverse relevant subtrees (e.g., JSX attributes, CSS properties within style objects/blocks) using utilities from `src/lib/ast/`.
        *   Extract relevant details (prop names/values, style keys/values, element type) using node properties (`node.type`, `node.text`, `node.children`).
        *   Display these details in the Inspector fields.
    *   **Inspector Edits → Code Changes:** When a value is changed in the Inspector:
        *   Identify the target AST node(s) corresponding to the edited field.
        *   Generate the updated code snippet for the changed property/attribute.
        *   **Surgical Edit Strategy:** Use the AST node's position (`node.startIndex`, `node.endIndex`) to precisely replace the old code fragment with the new one in the source file string.
        *   Write the modified file content back to the WebContainer using `webcontainerInstance.fs.writeFile()`.
        *   Trigger an AST re-parse (potentially incremental via `tree.edit()`) and notify other components via WebSocket.
*   **Tasks (WebSocket Synchronization - using Socket.IO):**
    *   **Server Setup:**
        *   Install `socket.io` on the backend.
        *   Attach a Socket.IO server instance to the main HTTP server (e.g., in `/src/app/api/socket/route.ts` for Next.js App Router).
        *   Implement connection handling (`io.on('connection', (socket) => { ... })`).
        *   Consider using Socket.IO rooms (`socket.join(initiativeId)`) to isolate communication per user session or project initiative.
    *   **Client Setup:**
        *   Install `socket.io-client` in the frontend application.
        *   Establish a WebSocket connection from the main application component to the server (likely managed in `src/hooks/useSocket.ts` and `src/lib/socket/client.ts`).
    *   **Event Handling:**
        *   **Code Editor (`src/components/code/Editor.tsx`):** On text change, debounce the event and emit a `code_change` event via WebSocket (`socket.emit('code_change', { filePath, newContent })`) to the server.
        *   **Server (`/src/app/api/socket/route.ts`):** On receiving `code_change`, broadcast (`io.to(roomId).emit(...)` or `socket.broadcast.to(roomId).emit(...)`) an `ast_update_required` event (with file path and potentially new content, as defined in `src/lib/socket/events.ts`) to other clients in the same room (specifically the Design canvas and Preview components).
        *   **Design Canvas (`src/components/design/Canvas.tsx`):** Listen for `ast_update_required`. When received, re-parse the relevant file's AST (Phase 3, using `src/hooks/useAst.ts`) and re-render the canvas visualization (Phase 4, using `src/hooks/useDesignView.ts`).
        *   **Inspector Edits (`src/components/design/Inspector.tsx`):** After successfully writing changes to the file (see above), emit a similar `code_change` event to ensure consistency, triggering updates in the editor (`src/components/code/Editor.tsx`) and preview (`src/components/preview/LivePreview.tsx`).
        *   **Design Canvas Selection (`src/components/design/Canvas.tsx`):** Emit a `design_select` event with node details when an element is selected on the canvas. The Inspector (`