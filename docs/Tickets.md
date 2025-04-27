# Development Tickets (v0.1)

Based on [ImplementationPlan.md](./docs/ImplementationPlan.md)

## Phase 1: Core Infrastructure, Basic Editor & Public GitHub Repo Loading
[See detailed plan in ImplementationPlan.md - Phase 1](./ImplementationPlan.md#phase-1-core-infrastructure-basic-editor--public-github-repo-loading)

*   [x] **Project Setup:** Initialize Next.js project (`create-next-app`).
*   [x] **Tailwind Configuration:**
    *   [x] Install and configure Tailwind CSS.
    *   [x] Define custom design tokens (colors, spacing, typography) in `tailwind.config.ts` based on design specs.
*   [x] **Headless UI Setup:** Install and configure Radix UI and Shadcn.
*   [x] **Basic Shared Components:**
    *   [x] Create `src/components/shared/Button.tsx` wrapping Radix primitive, styled with Tailwind.
    *   [x] Create `src/components/shared/Input.tsx` wrapping Radix primitive, styled with Tailwind.
*   [x] **Basic UI Shell:**
    *   [x] Implement root layout in `src/app/layout.tsx`.
    *   [x] Implement basic header in `src/components/core/Header.tsx`.
    *   [x] Implement home page (`src/app/page.tsx`) with a single input field for GitHub URL.
*   [x] **Public GitHub Repo Workflow (Frontend):**
    *   [x] Implement URL parsing logic in `src/lib/utils/url.ts` to extract owner/repo/branch.
    *   [x] Implement GitHub API fetching logic (unauthenticated tree/blob fetching) in `src/lib/github/repo.ts` using `fetch` or `octokit/rest.js`.
    *   [x] Add logic to use `NEXT_PUBLIC_GITHUB_PAT` environment variable for authenticated requests (higher rate limit).
    *   [x] Implement logic to prepare fetched files for WebContainer mounting format (initially maybe just store in memory/state).
        * _Files are currently stored in component state; will be adapted for WebContainer in Phase 2_
*   [x] **Editor Integration:**
    *   [x] Install Monaco Editor package.
    *   [x] Integrate basic Monaco Editor instance in `src/components/code/Editor.tsx`.
*   [x] **Basic File Reading (Pre-WebContainer):** Implement temporary logic to display fetched GitHub file content in the editor.
*   [x] **WebContainer Headers:** Configure COOP/COEP headers in `next.config.ts`.


## Phase 2: WebContainer Integration & File System
[See detailed plan in ImplementationPlan.md - Phase 2](./ImplementationPlan.md#phase-2-webcontainer-integration--file-system)

*   [] **WebContainer API Integration:** Install `@webcontainer/api`.
*   [] **WebContainer Bootstrapping:**
    *   [] Implement WebContainer initialization logic (in `src/lib/container/filesystem.ts`).
    *   [] Create `src/context/WebContainerContext.tsx` and `src/hooks/useWebContainer.ts` to manage the instance.
    *   [] Boot the instance on application load (via provider and trigger button in layout).
*   [] **File System API:**
    *   [] Implement `mount` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [] Implement `readFile` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [] Implement `writeFile` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [] Implement `mkdir` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [] Implement `rm` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [] Create `src/hooks/useFileSystem.ts` to interact with filesystem functions.
*   [] **Editor File System Integration:** Update `src/components/code/Editor.tsx` to read/write files using `useFileSystem` hook.
*   [] **GitHub Repo Mounting:** Update Phase 1 logic to `mount` the fetched GitHub repository files into the WebContainer's filesystem.

## Phase 3: Tree-sitter Integration & JavaScript AST Analysis
[See detailed plan in ImplementationPlan.md - Phase 3](./ImplementationPlan.md#phase-3-tree-sitter-integration--javascript-ast-analysis)

*   [] **Tree-sitter Setup:**
    *   [] Install `web-tree-sitter` library.
    *   [] Place pre-compiled JS grammar wasm (`tree-sitter-javascript.wasm`) in `/public/wasm/tree-sitter/`.
*   [] **Parser Initialization:**
    *   [] Implement `Language.load()` logic for the JS grammar in `src/lib/ast/parser.ts`.
    *   [] Implement parser initialization (`Parser.setLanguage()`) in `src/lib/ast/parser.ts`.
*   [] **AST Parsing:**
    *   [] Create `src/hooks/useAst.ts` to manage AST state.
    *   [] Implement parsing logic: On file load/edit (via `useFileSystem`), read content and call `parser.parse()` within `useAst`. Store the resulting `Tree`.
*   [] **AST Traversal & Utilities:**
    *   [] Implement basic AST traversal functions in `src/lib/ast/traversal.ts`.
    *   [] Develop utility functions (e.g., find function declarations, imports) in `src/lib/ast/traversal.ts` or `src/lib/ast/reactComponentUtils.ts`.
*   [] **Incremental Parsing:**
    *   [] Integrate `tree.edit(...)` and `parser.parse(..., oldTree)` into the editor's change handler within `useAst` or `src/components/code/Editor.tsx` for efficient updates.

## Phase 4: Design Mode - Component Preview via Isolated Vite App
[See detailed plan in ImplementationPlan.md - Phase 4](./ImplementationPlan.md#phase-4-design-mode---component-preview-via-isolated-vite-app)

*   [ ] **User Project Mounting:** Ensure user's repo is reliably mounted to `/project` in WebContainer.
*   [ ] **Component Map Generation:**
    *   [ ] Implement TSX/JSX file discovery logic within `/project/src`.
    *   [ ] Implement Tree-sitter parsing logic to extract default export names from discovered files.
    *   [ ] Implement logic to build the `componentMap` { ComponentName: filePath }.
*   [ ] **Preview App Scaffolding:**
    *   [ ] Implement logic to create `/preview-app` directory structure.
    *   [ ] Write `vite.config.ts` with `@user-project` alias to `/preview-app/`.
    *   [ ] **Write the generated `componentMap` to `/preview-app/src/componentMap.js`.**
    *   [ ] **Write a *new* `src/PreviewLoader.tsx` using the `componentMap` and `componentName` URL param.**
    *   [ ] Write `src/main.tsx` to `/preview-app/src/`.
    *   [ ] Write `index.html` to `/preview-app/`.
    *   [ ] Write `tsconfig.json` and `tsconfig.node.json` to `/preview-app/`.
    *   [ ] Write minimal `package.json` to `/preview-app/`.
*   [ ] **Dependency Installation:**
    *   [ ] Implement WebContainer process spawning (`spawn`) for `/preview-app`.
    *   [ ] Run `npm install react react-dom react-router-dom` in `/preview-app`.
    *   [ ] Run `npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom @types/react-router-dom` in `/preview-app`.
*   [ ] **Preview Server Booting:**
    *   [ ] Run `npx vite --port 5173` (or configured port) using `spawn` in `/preview-app`.
    *   [ ] Capture and store the Vite server URL upon `server-ready` event.
*   [ ] **Iframe Preview Component:**
    *   [ ] Create `src/components/preview/ComponentPreview.tsx` (or similar).
    *   [ ] Render an `<iframe>` in the component.
    *   [ ] Use `useFileSelection` hook to get the selected file path.
    *   [ ] **Implement logic to map the selected file path to a `componentName` using the generated map.**
    *   [ ] Dynamically construct the `iframe.src` URL (e.g., `VITE_URL/?componentName=ComponentName`) based on the resolved component name and stored Vite server URL.
    *   [ ] Handle file selections without default exports and server-not-ready states.
*   [ ] **Integration with UI:** Place the `ComponentPreview` component appropriately in the application layout (e.g., in a "Preview" or "Design" tab/panel).
*   [ ] **HMR Verification:** Confirm that changes made in the code editor to files in `/project/src` trigger updates in the preview iframe via Vite HMR. (Verify map regeneration isn't strictly needed for simple content changes).

## Phase 5: Code ↔ Design Sync & Inspector (AST & WebSocket)
[See detailed plan in ImplementationPlan.md - Phase 5](./ImplementationPlan.md#phase-5-code--design-sync--inspector-ast--websocket)

*   [ ] **Inspector UI:** Implement basic UI structure for `src/components/design/Inspector.tsx`.
*   [ ] **Selection Mapping (Design -> AST):**
    *   [ ] In `useDesignView` or `src/components/design/Canvas.tsx`, map selected React Flow node ID back to the corresponding AST node(s) using data stored during mapping (`src/lib/ast/mapper.ts`).
*   [ ] **Inspector Population:**
    *   [ ] On node selection, use the identified AST node(s) and utilities from `src/lib/ast/` to extract relevant details (props, styles, etc.).
    *   [ ] Display extracted details in `src/components/design/Inspector.tsx`.
*   [ ] **Inspector Edits -> Code:**
    *   [ ] Add input handlers to `src/components/design/Inspector.tsx`.
    *   [ ] On change, identify the target AST node and its source range (`startIndex`, `endIndex`).
    *   [ ] Generate the updated code string for the changed attribute/property.
    *   [ ] Read the current file content from WebContainer (`useFileSystem`).
    *   [ ] Replace the code segment in the string using the source range.
    *   [ ] Write the modified content back using `webcontainerInstance.fs.writeFile()` (`useFileSystem`).
    *   [ ] Trigger AST re-parse (incremental) via `useAst`.
*   [ ] **WebSocket Server Setup:**
    *   [ ] Install `socket.io`.
    *   [ ] Create API route `/src/app/api/socket/route.ts` and attach Socket.IO server.
    *   [ ] Implement basic connection handling and room logic (`socket.join`).
*   [ ] **WebSocket Client Setup:**
    *   [ ] Install `socket.io-client`.
    *   [ ] Implement client connection logic in `src/lib/socket/client.ts`.
    *   [ ] Create `src/hooks/useSocket.ts` to manage the connection and event handlers.
*   [ ] **WebSocket Event Handling:**
    *   [ ] Define event types in `src/lib/socket/events.ts` (e.g., `code_change`, `ast_update_required`).
    *   [ ] **Editor -> Server:** In `src/components/code/Editor.tsx`, on change (debounced), emit `code_change` via `useSocket`.
    *   [ ] **Server -> Clients:** In `/src/app/api/socket/route.ts`, on `code_change`, broadcast `ast_update_required` to the room.
    *   [ ] **Design Canvas Listener:** In `useDesignView` or `src/components/design/Canvas.tsx`, listen for `ast_update_required` via `useSocket`, trigger re-parse (`useAst`) and re-render.
    *   [ ] **Inspector -> Server:** After writing file changes in Inspector, emit `code_change` via `useSocket` to notify editor/preview.
    *   [ ] **Editor Listener:** In `src/components/code/Editor.tsx`, potentially listen for external changes (e.g., from Inspector) to update editor content if needed (Monaco might handle this automatically if file content changes).
    *   [ ] **Preview Listener:** Prepare `src/components/preview/LivePreview.tsx` to listen for updates (details in Phase 6).

## Phase 6: Interactive Preview & Execution
[See detailed plan in ImplementationPlan.md - Phase 6](./ImplementationPlan.md#phase-6-interactive-preview--execution)

*   [ ] **Process Spawning:**
    *   [ ] Implement process spawning logic (`webcontainerInstance.spawn`) in `src/lib/container/process.ts`.
    *   [ ] Add UI elements (e.g., a 'Run Dev Server' button) to trigger the spawn command (e.g., `npm run dev`).
*   [ ] **Server Ready Handling:**
    *   [ ] Listen for the `server-ready` event from the WebContainer instance (`useWebContainer`).
    *   [ ] Extract the preview URL from the event data.
*   [ ] **Preview Display:**
    *   [ ] Implement the `src/components/preview/LivePreview.tsx` component.
    *   [ ] Use an `<iframe>` within the component.
    *   [ ] Set the `iframe.src` to the preview URL obtained from the `server-ready` event.
*   [ ] **Live Reload Integration:**
    *   [ ] Ensure file writes (from Editor or Inspector via `useFileSystem`) trigger the development server's live reload within the WebContainer (often automatic with tools like Vite/Next.js dev server).
    *   [ ] If necessary, implement WebSocket logic (`ast_update_required` or a dedicated `preview_refresh` event) in `LivePreview.tsx` to manually reload the iframe if the dev server doesn't pick up changes reliably.
*   [ ] **Shareable Preview (Placeholder):** Create basic component structure for `src/components/preview/ShareablePreview.tsx` (functionality deferred).

## Phase 7: AI Agent Integration
[See detailed plan in ImplementationPlan.md - Phase 7](./ImplementationPlan.md#phase-7-ai-agent-integration)

*   [ ] **Vercel AI SDK Setup:**
    *   [ ] Install `ai`, `@ai-sdk/react`, and chosen LLM provider SDK (e.g., `@ai-sdk/openai`).
    *   [ ] Configure environment variables for the LLM API key.
*   [ ] **Server-Side API Endpoint:**
    *   [ ] Create `/src/app/api/ai/chat/route.ts`.
    *   [ ] Implement basic handler structure using `streamText` or `generateText`.
*   [ ] **Core Agent Logic:** Define initial agent structure in `src/lib/ai/agent.ts`.
*   [ ] **AI Tool Definition (Schema):**
    *   [ ] Define Zod schemas for `readFile` and `editFile` tools in `src/lib/ai/tools.ts`.
*   [ ] **AI Tool Implementation (Execution):**
    *   [ ] Implement the execution logic for `readFile` in `src/lib/ai/tools.ts` using `useFileSystem` (or direct WebContainer access if needed server-side).
    *   [ ] Implement the execution logic for `editFile` in `src/lib/ai/tools.ts` using `useFileSystem` (or direct WebContainer access).
*   [ ] **Chat UI Implementation:**
    *   [ ] Create `src/components/ai/Chat.tsx`.
    *   [ ] Create `src/components/ai/ChatMessage.tsx`.
    *   [ ] Use `useChat` (or `useAssistant`) hook from `@ai-sdk/react` in `Chat.tsx` to manage state, input, and connect to the API endpoint.
*   [ ] **Tool Integration:** Integrate the defined tools (`src/lib/ai/tools.ts`) into the server-side API endpoint (`/src/app/api/ai/chat/route.ts`) for the AI model to use.
*   [ ] **AI Change Synchronization:** Ensure `editFile` tool execution triggers the necessary file system updates (`useFileSystem`) and WebSocket events (`useSocket`) to reflect changes in the Editor and Design views.

## Phase 8: Advanced Features & Refinements (Placeholders)
[See detailed plan in ImplementationPlan.md - Phase 8](./ImplementationPlan.md#phase-8-advanced-features--refinements)

*   [ ] **Intent-Ingestion Hub:** (Placeholder - detailed tickets later)
    *   [ ] Figma Import
    *   [ ] Enhanced GitHub Integration
    *   [ ] Doc Ingestion
*   [ ] **Knowledge Graph / Embeddings:** (Placeholder - detailed tickets later)
*   [ ] **Design Mode Refinements:** (Placeholder - detailed tickets later)
*   [ ] **Collaboration Features:** (Placeholder - detailed tickets later)
*   [ ] **Performance & Testing:** (Placeholder - detailed tickets later)
