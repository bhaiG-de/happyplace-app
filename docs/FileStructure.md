# 21st Gen IDE File Structure (Sandpack Adapted)

## Root Directory

```
/
├── .github/                     # GitHub configuration
├── public/                      # Static assets (WASM directory removed)
├── src/                         # Source code
├── .env.example                 # Environment variables example
├── .gitignore                   # Git ignore configuration
├── next.config.js               # Next.js configuration (COOP/COEP headers removed, may be re-added if needed elsewhere)
├── package.json                 # Dependencies and scripts (Sandpack, React Flow, **@babel/parser, Recast, Prettier [client]**)
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration (including custom tokens)
└── README.md                    # Project documentation
```

## Source Code (`/src`)

```
/src
├── app/                         # Next.js App Router
│   ├── api/                     # API routes
│   │   ├── ai/                  # AI-related endpoints
│   │   │   └── chat/           # AI chat endpoint for LLM integration
│   │   ├── github/             # GitHub integration endpoints
│   │   └── socket/             # WebSocket endpoints for real-time sync (if needed beyond Sandpack)
│   ├── (auth)/                 # Authentication routes (group)
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup page
│   ├── instance/               # Instance routes (or simplified if Sandpack handles setup differently)
│   │   └── [id]/              # Dynamic instance route
│   │       └── page.tsx        # Instance page integrating Sandpack provider/components
│   ├── initiatives/            # Project initiatives routes
│   │   └── [id]/              # Initiative details with tab system (Knowledge/Design/Code)
│   ├── layout.tsx              # Root layout with global providers (incl. potentially SandpackProvider at a higher level)
│   └── page.tsx                # Home page with initiatives list
├── components/                  # Reusable UI components
│   ├── ai/                     # AI-related components
│   │   ├── Chat.tsx            # Chat interface with streaming responses
│   │   └── ChatMessage.tsx     # Individual chat message with markdown support
│   ├── core/                   # Core UI components
│   │   ├── Header.tsx          # App header with tabs and actions
│   │   ├── Navigation.tsx      # Side navigation with shared file tree
│   │   ├── FileTree.tsx        # Shared file explorer (potentially SandpackFileExplorer or custom)
│   │   └── Tabs.tsx            # Tab navigation between Knowledge/Design/Code
│   ├── design/                 # Design mode components
│   │   ├── Canvas.tsx          # React Flow canvas for rendering AST visualization
│   │   ├── Inspector.tsx       # Property inspector for editing component props (reads props from AST node found via UID map)
│   │   ├── Nodes/              # React Flow node components
│   │   │   ├── ComponentNode.tsx    # Visual representation of React components
│   │   │   ├── ContainerNode.tsx    # Nodes for wrapping child components
│   │   │   ├── PrimitiveNode.tsx    # Nodes for simple elements
│   │   │   └── index.ts            # Node type exports
│   │   ├── Edges/              # React Flow edge components
│   │   │   ├── ComponentEdge.tsx    # Edges showing parent-child relationships
│   │   │   ├── DataFlowEdge.tsx     # Edges showing data flow between components
│   │   │   └── index.ts            # Edge type exports 
│   │   ├── Controls.tsx        # Custom React Flow controls and tools
│   │   └── CanvasToolbar.tsx   # Toolbar for design canvas actions
│   ├── code/                   # Code mode components
│   │   ├── Editor.tsx          # Monaco editor wrapper (integrates with Sandpack state via `useActiveCode`)
│   │   ├── EditorTabs.tsx      # Tabs for multiple open files (potentially `FileTabs` from Sandpack or custom)
│   │   └── ~~Terminal.tsx~~    # **REMOVED:** Sandpack doesn't provide a direct terminal
│   ├── preview/                # Preview components (Leveraging Sandpack)
│   │   ├── SandpackPreviewWrapper.tsx # **NEW/REPLACES:** Wrapper around <SandpackPreview> handling communication, etc.
│   │   └── ShareablePreview.tsx # Shareable preview generation (logic might change)
│   └── shared/                 # Shared UI components (wrapping Radix, styled w/ Tailwind)
│       ├── Button.tsx          # Button component
│       ├── Input.tsx           # Input component
│       └── Modal.tsx           # Modal component
├── lib/                         # Utility libraries
│   ├── ai/                     # AI utilities
│   │   ├── agent.ts            # AI agent logic (tools use Sandpack file ops)
│   │   └── tools.ts            # AI tools implementation (file ops via Sandpack, AST manipulation via client registry/codegen)
│   ├── ast/                    # **REVISED:** Client-side AST handling with **@babel/parser**
│   │   ├── parser.ts           # **NEW:** Client-side parsing logic using **@babel/parser** (with JSX/TS plugins)
│   │   ├── traversal.ts        # AST traversal utilities (e.g., for `data-uid` injection, prop extraction - use `@babel/traverse`?)
│   │   ├── instrumentation.ts  # **NEW:** Logic for injecting `data-uid` and building UID-to-AST map
│   │   ├── propExtraction.ts   # **NEW:** Utility to extract props from JSX AST nodes
│   │   ├── mapper.ts           # Converts **Babel AST** nodes to React Flow nodes/edges
│   │   ├── codegen.ts          # AST to code generation (Recast + Prettier, preserves/re-injects `data-uid`)
│   │   └── ~~clientRegistry.ts~~ # **REMOVED/Merged:** Logic likely within useAstRegistry hook
│   ├── reactFlow/              # React Flow integration utilities
│   │   ├── nodeTypes.ts        # Custom node type definitions
│   │   ├── edgeTypes.ts        # Custom edge type definitions
│   │   ├── layoutEngine.ts     # Automatic layout positioning for components
│   │   └── interactions.ts     # Custom React Flow interactions
│   ├── sandpack/               # **NEW:** Sandpack related utilities/helpers (optional)
│   │   └── files.ts            # Example: Helpers for manipulating Sandpack file structures
│   ├── github/                 # GitHub API utilities
│   │   ├── repo.ts             # Repository operations (fetch files for Sandpack `files` prop)
│   │   └── auth.ts             # GitHub authentication
│   ├── socket/                 # WebSocket utilities (May be less critical if Sandpack sync suffices)
│   │   ├── client.ts           # Socket.io client setup
│   │   └── events.ts           # WebSocket event definitions for sync
│   └── utils/                  # General utilities
│       ├── debounce.ts         # Debounce utility for editor changes
│       └── url.ts              # URL parsing utilities
├── hooks/                       # Custom React hooks
│   ├── useAstRegistry.ts       # **REVISED:** Hook managing client AST state (parsing w/ **@babel/parser**, storing **Babel ASTs**, storing UID-to-AST map, handling updates)
│   ├── ~~useWebContainer.ts~~  # **REMOVED**
│   ├── ~~useFileSystem.ts~~    # **REMOVED/REPLACED** (File ops via Sandpack hooks e.g. `useActiveCode`)
│   ├── useFileSelection.ts     # Hook to manage shared file selection state
│   ├── useDesignView.ts        # React Flow state and operations for design view
│   ├── useReactFlow.ts         # React Flow integration with AST changes
│   ├── useCodeView.ts          # Editor state (integrates with `useActiveCode`)
│   ├── useSocket.ts            # WebSocket connection and event handlers (May change role)
├── context/                     # React context providers
│   ├── AppContext.tsx          # Main app context with global state
│   ├── FileTreeContext.tsx     # Shared file tree and selection state
│   ├── InitiativeContext.tsx   # Project initiative data and operations
│   ├── DesignContext.tsx       # React Flow state and AST visualization config
│   ├── CodeContext.tsx         # Editor state and open files tracking
│   ├── ~~WebContainerContext.tsx~~ # **REMOVED**
│   ├── AstRegistryContext.tsx  # **REVISED/Optional:** Context wrapping client-side `useAstRegistry` (using **Babel AST**)
│   └── SandpackContextWrapper.tsx # **NEW/Optional:** If <SandpackProvider> isn't at the root
├── types/                       # TypeScript type definitions
│   ├── ast.ts                  # AST node and tree types (**Babel AST** types)
│   ├── ~~container.ts~~        # **REMOVED**
│   ├── initiative.ts           # Initiative/project types and metadata
│   ├── fileTree.ts             # File tree structure and selection types
│   ├── reactFlow.ts            # React Flow node and edge custom types
│   └── github.ts               # GitHub API types
└── styles/                      # Global styles & Design System configuration
    ├── globals.css             # Global CSS resets and base styles
    └── theme.ts                # Tailwind theme extensions (colors, spacing, typography)
```

## Public Directory (`/public`)

```/public
├── favicon.ico                  # App favicon
├── logo.svg                     # App logo
├── ~~wasm/~~                    # **REMOVED:** WASM files no longer needed client-side
├── templates/                   # Project templates (May be less relevant if Sandpack templates are used)
│   ├── react-app/              # React application template
│   └── next-app/               # Next.js application template
└── fonts/                       # Custom fonts
```

## API Structure

### AI Chat API
- `POST /api/ai/chat` - Handles chat messages and AI responses with tool execution (Tools adapted for Sandpack and client-side AST registry)

### GitHub API
- `GET /api/github/repos` - List repositories for the authenticated user
- `POST /api/github/repo/load` - Fetch repo files to populate Sandpack `files` prop
- `GET /api/github/repo/[owner]/[repo]/files` - Get repository files and structure

### WebSocket Endpoints
- `/api/socket` - Socket.IO connection endpoint (Role might change, less critical for core file sync if relying on Sandpack state)
  - Events: Potentially simplified (e.g., cursor presence, high-level state sync)

## React Flow Integration for AST Visualization

1.  **AST Retrieval & Analysis**: (Client-Side)
    *   `src/hooks/useAstRegistry.ts` manages AST state, triggering **client-side parsing with @babel/parser** (`src/lib/ast/parser.ts`) on file changes.
    *   The hook also manages **`data-uid` injection** (`src/lib/ast/instrumentation.ts`) and stores the **UID-to-AST map** alongside the ASTs.
    *   `src/lib/ast/traversal.ts` & `src/lib/ast/mapper.ts` operate on the **client-side Babel AST**.
    *   `src/lib/ast/codegen.ts` handles client-side code modifications based on the **Babel AST**.
    *   `src/lib/reactFlow/nodeTypes.ts` defines visual representations. (Unchanged)
    *   `src/lib/reactFlow/layoutEngine.ts` handles automatic positioning. (Unchanged)

2.  **React Flow Canvas**: (Unchanged)
    *   `src/components/design/Canvas.tsx` implements the main React Flow instance.

3.  **State Management**:
    *   `src/hooks/useReactFlow.ts` manages React Flow state. (Unchanged)
    *   `src/hooks/useDesignView.ts` connects AST changes (derived from Sandpack state) to visual updates.
    *   `src/context/DesignContext.tsx` provides design state. (Unchanged)

4.  **Synchronization**: (Client-Side Focus)
    *   Updates flow from Sandpack state (`updateCode` call -> state change -> `useAstRegistry` triggers re-parse & re-instrumentation -> React Flow update).
    *   WebSocket role might shift towards collaboration features rather than core file sync.

## App Architecture and Features (Sandpack Adapted)

1.  **Shared Left Panel**: (Unchanged conceptually)
    *   Contains Home, Design System, File Tree.
    *   Selection affects Design and Code views.

2.  **Design Mode**: (Unchanged conceptually)
    *   React Flow canvas visualizes components based on AST derived from Sandpack state.
    *   Inspector edits trigger AST patching -> `codegen` -> `updateCode`.

3.  **Code Mode**: (Client-Side Parsing)
    *   Monaco editor displays files from Sandpack state (`useActiveCode`).
    *   Changes use `updateCode` to modify Sandpack state, triggering client-side re-parsing with **@babel/parser** via `useAstRegistry`.

4.  **Preview**:
    *   Managed by `<SandpackPreview>` (likely wrapped).
    *   Updates automatically via Sandpack's HMR when `updateCode` is called.

5.  **Tabs System**: (Unchanged)
    *   Knowledge/Design/Code tabs provide different views of the project.

6.  **AI Integration**: (Client-Side AST)
    *   Chat interface.
    *   Tools operate on Sandpack file state and **client-side Babel AST registry/map** (`editFile` uses `codegen.ts`).

## ~~Preview App Structure (`/preview-app`)~~ **REMOVED**

This section is obsolete. Sandpack provides its own integrated preview environment via the `<SandpackPreview>` component, eliminating the need to generate a separate Vite application inside the container.
