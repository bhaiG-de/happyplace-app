# Development Tickets (v0.1)

Based on [ImplementationPlan.md](./docs/ImplementationPlan.md)

## Phase 1: Core Infrastructure, Basic Editor & Public GitHub Repo Loading
[See detailed plan in ImplementationPlan.md - Phase 1](./docs/ImplementationPlan.md#phase-1-core-infrastructure-basic-editor--public-github-repo-loading)

*   [ ] **Project Setup:** Initialize Next.js project (`create-next-app`).
*   [ ] **Tailwind Configuration:**
    *   [ ] Install and configure Tailwind CSS.
    *   [ ] Define custom design tokens (colors, spacing, typography) in `tailwind.config.ts` based on design specs.
*   [ ] **Headless UI Setup:** Install and configure Radix UI (or chosen alternative).
*   [ ] **Basic Shared Components:**
    *   [ ] Create `src/components/shared/Button.tsx` wrapping Radix primitive, styled with Tailwind.
    *   [ ] Create `src/components/shared/Input.tsx` wrapping Radix primitive, styled with Tailwind.
*   [ ] **Basic UI Shell:**
    *   [ ] Implement root layout in `src/app/layout.tsx`.
    *   [ ] Implement basic header in `src/components/core/Header.tsx`.
    *   [ ] Implement home page (`src/app/page.tsx`) with a single input field for GitHub URL.
*   [ ] **Public GitHub Repo Workflow (Frontend):**
    *   [ ] Implement URL parsing logic in `src/lib/utils/url.ts` to extract owner/repo/branch.
    *   [ ] Implement GitHub API fetching logic (unauthenticated tree/blob fetching) in `src/lib/github/repo.ts` using `fetch` or `octokit/rest.js`.
    *   [ ] Implement logic to prepare fetched files for WebContainer mounting format (initially maybe just store in memory/state).
*   [ ] **Editor Integration:**
    *   [ ] Install Monaco Editor package.
    *   [ ] Integrate basic Monaco Editor instance in `src/components/code/Editor.tsx`.
*   [ ] **Basic File Reading (Pre-WebContainer):** Implement temporary logic to display fetched GitHub file content in the editor.
*   [ ] **WebContainer Headers:** Configure COOP/COEP headers in `next.config.js`.

## Phase 2: WebContainer Integration & File System
[See detailed plan in ImplementationPlan.md - Phase 2](./docs/ImplementationPlan.md#phase-2-webcontainer-integration--file-system)

*   [ ] **WebContainer API Integration:** Install `@webcontainer/api`.
*   [ ] **WebContainer Bootstrapping:**
    *   [ ] Implement WebContainer initialization logic (potentially in `src/lib/container/setup.ts`).
    *   [ ] Create `src/context/WebContainerContext.tsx` and `src/hooks/useWebContainer.ts` to manage the instance.
    *   [ ] Boot the instance on application load.
*   [ ] **File System API:**
    *   [ ] Implement `mount` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [ ] Implement `readFile` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [ ] Implement `writeFile` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [ ] Implement `mkdir` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [ ] Implement `rm` function using WebContainer fs API in `src/lib/container/filesystem.ts`.
    *   [ ] Create `src/hooks/useFileSystem.ts` to interact with filesystem functions.
*   [ ] **Editor File System Integration:** Update `src/components/code/Editor.tsx` to read/write files using `useFileSystem` hook.
*   [ ] **GitHub Repo Mounting:** Update Phase 1 logic to `mount` the fetched GitHub repository files into the WebContainer's filesystem.

## Phase 3: Tree-sitter Integration & JavaScript AST Analysis
[See detailed plan in ImplementationPlan.md - Phase 3](./docs/ImplementationPlan.md#phase-3-tree-sitter-integration--javascript-ast-analysis)

*   [ ] **Tree-sitter Setup:**
    *   [ ] Install `web-tree-sitter` library.
    *   [ ] Place pre-compiled JS grammar wasm (`tree-sitter-javascript.wasm`) in `/public/wasm/tree-sitter/`.
*   [ ] **Parser Initialization:**
    *   [ ] Implement `Language.load()` logic for the JS grammar in `src/lib/ast/parser.ts`.
    *   [ ] Implement parser initialization (`Parser.setLanguage()`) in `src/lib/ast/parser.ts`.
*   [ ] **AST Parsing:**
    *   [ ] Create `src/hooks/useAst.ts` to manage AST state.
    *   [ ] Implement parsing logic: On file load/edit (via `useFileSystem`), read content and call `parser.parse()` within `useAst`. Store the resulting `Tree`.
*   [ ] **AST Traversal & Utilities:**
    *   [ ] Implement basic AST traversal functions in `src/lib/ast/traversal.ts`.
    *   [ ] Develop utility functions (e.g., find function declarations, imports) in `src/lib/ast/traversal.ts` or `src/lib/ast/reactComponentUtils.ts`.
*   [ ] **Incremental Parsing:**
    *   [ ] Integrate `tree.edit(...)` and `parser.parse(..., oldTree)` into the editor's change handler within `useAst` or `src/components/code/Editor.tsx` for efficient updates.

## Phase 4: Design Mode - Visual DOM Representation
[See detailed plan in ImplementationPlan.md - Phase 4](./docs/ImplementationPlan.md#phase-4-design-mode---visual-dom-representation)

*   [ ] **React Flow Setup:**
    *   [ ] Install `reactflow` library.
    *   [ ] Implement basic `<ReactFlowProvider>` and `<ReactFlow>` setup in `src/components/design/Canvas.tsx`.
*   [ ] **Custom Nodes & Edges:**
    *   [ ] Define `ComponentNode` structure in `src/components/design/Nodes/ComponentNode.tsx`.
    *   [ ] Define `ContainerNode` structure (if needed) in `src/components/design/Nodes/ContainerNode.tsx`.
    *   [ ] Define `ComponentEdge` structure in `src/components/design/Edges/ComponentEdge.tsx`.
    *   [ ] Register node types in `src/lib/reactFlow/nodeTypes.ts`.
    *   [ ] Register edge types in `src/lib/reactFlow/edgeTypes.ts`.
*   [ ] **React Flow UI:**
    *   [ ] Implement basic controls in `src/components/design/Controls.tsx`.
    *   [ ] Implement basic toolbar in `src/components/design/CanvasToolbar.tsx`.
*   [ ] **AST to React Flow Mapper:**
    *   [ ] Implement core logic in `src/lib/ast/mapper.ts` to traverse AST (from `useAst`) and generate `nodes` and `edges` arrays.
    *   [ ] Define node structure (`id`, `type`, `position`, `data`).
    *   [ ] Define edge structure (`id`, `source`, `target`, `type`).
    *   [ ] Utilize `src/lib/ast/reactComponentUtils.ts` for component identification.
*   [ ] **State Management:**
    *   [ ] Create `src/context/DesignContext.tsx` (or use Zustand store).
    *   [ ] Create `src/hooks/useReactFlow.ts` to manage nodes/edges/viewport state.
    *   [ ] Create `src/hooks/useDesignView.ts` to connect AST data (from `useAst`) to React Flow state (`useReactFlow`).
    *   [ ] Pass state and handlers (`onNodesChange`, etc.) to `<ReactFlow>` in `src/components/design/Canvas.tsx`.
*   [ ] **File Tree Integration:**
    *   [ ] Implement basic file tree UI in `src/components/core/FileTree.tsx` (part of `src/components/core/Navigation.tsx`).
    *   [ ] Create `src/hooks/useFileSelection.ts` to manage selected file/folder state.
    *   [ ] Connect file selection state to `useDesignView` to trigger AST parsing/mapping for the selected scope.
*   [ ] **Basic Navigation/Selection:**
    *   [ ] Implement `onNodeClick` in `src/components/design/Canvas.tsx` to handle node selection state.

## Phase 5: Code ↔ Design Sync & Inspector (AST & WebSocket)
[See detailed plan in ImplementationPlan.md - Phase 5](./docs/ImplementationPlan.md#phase-5-code--design-sync--inspector-ast--websocket)

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
[See detailed plan in ImplementationPlan.md - Phase 6](./docs/ImplementationPlan.md#phase-6-interactive-preview--execution)

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
[See detailed plan in ImplementationPlan.md - Phase 7](./docs/ImplementationPlan.md#phase-7-ai-agent-integration)

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
[See detailed plan in ImplementationPlan.md - Phase 8](./docs/ImplementationPlan.md#phase-8-advanced-features--refinements)

*   [ ] **Intent-Ingestion Hub:** (Placeholder - detailed tickets later)
    *   [ ] Figma Import
    *   [ ] Enhanced GitHub Integration
    *   [ ] Doc Ingestion
*   [ ] **Knowledge Graph / Embeddings:** (Placeholder - detailed tickets later)
*   [ ] **Design Mode Refinements:** (Placeholder - detailed tickets later)
*   [ ] **Collaboration Features:** (Placeholder - detailed tickets later)
*   [ ] **Performance & Testing:** (Placeholder - detailed tickets later)
