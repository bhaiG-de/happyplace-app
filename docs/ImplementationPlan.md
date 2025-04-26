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

**Phase 4: Design Mode - Visual DOM Representation**

*   **Goal:** Create the initial "Design Mode" canvas displaying a visual representation based on code structure using React Flow.
*   **Tasks:**
    *   **Setup React Flow Canvas:**
        *   Implement the main canvas component (`src/components/design/Canvas.tsx`) using the `<ReactFlowProvider>` and `<ReactFlow>` components from `reactflow`.
        *   Define custom node types (e.g., `ComponentNode`, `ContainerNode`) in `src/components/design/Nodes/` and register them in `src/lib/reactFlow/nodeTypes.ts` to be passed to the `<ReactFlow>` `nodeTypes` prop.
        *   Define custom edge types (e.g., `ComponentEdge`) in `src/components/design/Edges/` and register them in `src/lib/reactFlow/edgeTypes.ts` to be passed to the `<ReactFlow>` `edgeTypes` prop.
        *   Configure basic React Flow controls (`src/components/design/Controls.tsx`) and potentially a toolbar (`src/components/design/CanvasToolbar.tsx`).
    *   **AST to React Flow Translation:**
        *   Enhance `src/lib/ast/mapper.ts` to traverse the AST (from Phase 3) and generate arrays of `nodes` and `edges` compatible with React Flow.
        *   Each node object should contain an `id`, `type` (matching a key in `nodeTypes`), `position` (initially perhaps random or grid-based, later driven by `src/lib/reactFlow/layoutEngine.ts`), and `data` (containing AST node info, component name, props, etc.).
        *   Each edge object should contain an `id`, `source` node id, `target` node id, and `type` (matching a key in `edgeTypes`).
        *   Use the logic from `src/lib/ast/reactComponentUtils.ts` to identify components and their relationships for mapping.
    *   **State Management & Rendering:**
        *   Manage React Flow state (nodes, edges, viewport) likely using Zustand or React Context (`src/context/DesignContext.tsx`) combined with hooks like `src/hooks/useReactFlow.ts` and `src/hooks/useDesignView.ts`.
        *   Pass the generated `nodes` and `edges` state to the `<ReactFlow>` component.
        *   Implement `onNodesChange`, `onEdgesChange`, `onConnect` handlers provided by `reactflow` for basic interactivity.
        *   Map file/folder structure from the AST or file system to the shared file tree component (`src/components/core/FileTree.tsx` within `src/components/core/Navigation.tsx`), managed by `src/hooks/useFileSelection.ts`.
    *   **Initial Navigation & Selection:**
        *   Implement basic node selection (`onNodeClick`) to highlight nodes on the canvas.
        *   Connect file selection from `src/components/core/FileTree.tsx` to update the nodes/edges displayed on the canvas (handled by `src/hooks/useDesignView.ts`).
*   **Technologies:** React Flow (`reactflow`), AST analysis logic (`src/lib/ast/`), State Management (Zustand or Context), TypeScript.

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
        *   **Design Canvas Selection (`src/components/design/Canvas.tsx`):** Emit a `design_select` event with node details when an element is selected on the canvas. The Inspector (`src/components/design/Inspector.tsx`) listens for this to populate itself. (This might not need broadcasting if the Inspector state is local).
        *   **Preview (`src/components/preview/LivePreview.tsx`):** Listen for `ast_update_required` (or a specific `preview_refresh` event) to potentially trigger a reload or update within the preview iframe (Phase 6).
*   **Technologies:** AST manipulation (`src/lib/ast/`, Tree-sitter API), `socket.io` (server), `socket.io-client` (client), UI components (`src/components/`), WebContainer API (`fs.writeFile`).

**Phase 6: Interactive Preview & Execution**

*   **Goal:** Enable running the user's code within the WebContainer and displaying a live preview.
*   **Tasks:**
    *   Use WebContainer's process spawning (`spawn`) to run build commands (e.g., `npm run dev`, `vite`) within the container (managed via `src/lib/container/process.ts`).
    *   Listen for the `server-ready` event from the WebContainer.
    *   Display the running application output in an iframe or dedicated preview component (`src/components/preview/LivePreview.tsx`).
    *   Implement live reloading based on file changes within the WebContainer.
    *   Develop the "Shareable Preview" functionality (URL generation, potentially snapshotting, e.g., `src/components/preview/ShareablePreview.tsx`).
*   **Technologies:** WebContainer API (`spawn`, `server-ready`, `fs`).

**Phase 7: AI Agent Integration**

*   **Goal:** Integrate the AI assistant for intent processing and tool execution using the Vercel AI SDK.
*   **Tasks:**
    *   Install and configure the Vercel AI SDK (`ai` package) and the chosen LLM provider (e.g., `@ai-sdk/openai`).
    *   Implement the server-side API endpoint (e.g., `/src/app/api/ai/chat/route.ts`) to handle chat/assistant requests.
    *   Define the core AI agent logic (potentially in `src/lib/ai/agent.ts`) using `streamText` or `generateText` for handling prompts and potentially generating code/responses. Consider `useAssistant` hook if needing stateful OpenAI Assistant features.
    *   Define the agent's toolset (`readFile`, `editFile` via WebContainer fs, potentially Figma/Graph DB tools later) using Zod schemas for parameters (`schema`) and implementing the execution logic (in `src/lib/ai/tools.ts`).
    *   Implement the chat UI seen in wireframes (`src/components/ai/Chat.tsx`) using the `@ai-sdk/react` hooks (`useChat` or `useAssistant`) to manage message state, input handling, and streaming UI updates.
    *   Connect user prompts from the chat UI (`src/components/ai/Chat.tsx`) to the server-side API endpoint (`/src/app/api/ai/chat/route.ts`).
    *   Integrate the agent's tool `execute` functions (`src/lib/ai/tools.ts`) with the WebContainer APIs (file system access via `fs`, process spawning via `spawn`).
    *   Ensure AI-driven code changes (from `editFile` tool) are reflected in both Code (`src/components/code/Editor.tsx`) and Design (`src/components/design/Canvas.tsx`) modes via the sync mechanism (Phase 5). Use streaming responses (`toDataStreamResponse` or `pipeDataStreamToResponse`) for real-time feedback.
*   **Technologies:** Vercel AI SDK (`ai`, `@ai-sdk/react`, providers like `@ai-sdk/openai`), Zod, WebContainer API, Large Language Model APIs.

**Phase 8: Advanced Features & Refinements**

*   **Goal:** Build out remaining features from the shared understanding and refine the user experience.
*   **Tasks:**
    *   Implement the "Intent-Ingestion Hub" (Figma import, GitHub integration, Doc ingestion).
    *   Develop the Knowledge Graph / Embedding Store for the AI.
    *   Refine the Design Mode (node/edge interactions, free-form elements).
    *   Implement collaboration features (sharing, multi-user).
    *   Performance optimizations and testing.
*   **Technologies:** Figma API, GitHub API, Vector Databases, Graph Databases.
