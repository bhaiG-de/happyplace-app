# 21st Gen IDE File Structure

## Root Directory

```
/
├── .github/                     # GitHub configuration
├── public/                      # Static assets
├── src/                         # Source code
├── .env.example                 # Environment variables example
├── .gitignore                   # Git ignore configuration
├── next.config.js               # Next.js configuration with WebContainer headers
├── package.json                 # Dependencies and scripts including React Flow and Tree-sitter
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
│   │   └── socket/             # WebSocket endpoints for real-time sync
│   ├── (auth)/                 # Authentication routes (group)
│   │   ├── login/              # Login page
│   │   └── signup/             # Signup page
│   ├── initiatives/            # Project initiatives routes
│   │   └── [id]/              # Initiative details with tab system (Knowledge/Design/Code)
│   ├── layout.tsx              # Root layout with global providers
│   └── page.tsx                # Home page with initiatives list
├── components/                  # Reusable UI components
│   ├── ai/                     # AI-related components
│   │   ├── Chat.tsx            # Chat interface with streaming responses
│   │   └── ChatMessage.tsx     # Individual chat message with markdown support
│   ├── core/                   # Core UI components
│   │   ├── Header.tsx          # App header with tabs and actions
│   │   ├── Navigation.tsx      # Side navigation with shared file tree
│   │   ├── FileTree.tsx        # Shared file explorer that affects both views
│   │   └── Tabs.tsx            # Tab navigation between Knowledge/Design/Code
│   ├── design/                 # Design mode components
│   │   ├── Canvas.tsx          # React Flow canvas for rendering AST visualization
│   │   ├── Inspector.tsx       # Property inspector for editing component props
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
│   │   ├── Editor.tsx          # Monaco editor wrapper with AST integration
│   │   ├── EditorTabs.tsx      # Tabs for multiple open files in Code mode
│   │   └── Terminal.tsx        # Terminal component for WebContainer commands
│   ├── preview/                # Preview components
│   │   ├── LivePreview.tsx     # Interactive preview from WebContainer
│   │   └── ShareablePreview.tsx # Shareable preview generation
│   └── shared/                 # Shared UI components (wrapping Radix, styled w/ Tailwind)
│       ├── Button.tsx          # Button component
│       ├── Input.tsx           # Input component
│       └── Modal.tsx           # Modal component
├── lib/                         # Utility libraries
│   ├── ai/                     # AI utilities
│   │   ├── agent.ts            # AI agent logic with tool execution
│   │   └── tools.ts            # AI tools implementation (file ops, AST)
│   ├── ast/                    # AST handling with Tree-sitter
│   │   ├── parser.ts           # Tree-sitter parser initialization and management
│   │   ├── traversal.ts        # AST traversal utilities for component detection
│   │   ├── reactComponentUtils.ts # React component detection and analysis
│   │   └── mapper.ts           # Converts AST to React Flow nodes/edges for Design view
│   ├── reactFlow/              # React Flow integration utilities
│   │   ├── nodeTypes.ts        # Custom node type definitions
│   │   ├── edgeTypes.ts        # Custom edge type definitions
│   │   ├── layoutEngine.ts     # Automatic layout positioning for components
│   │   └── interactions.ts     # Custom React Flow interactions
│   ├── container/              # WebContainer utilities
│   │   ├── filesystem.ts       # Virtual filesystem operations
│   │   ├── process.ts          # Process management for npm/node
│   │   └── setup.ts            # Container initialization and configuration
│   ├── github/                 # GitHub API utilities
│   │   ├── repo.ts             # Repository operations (clone, fetch)
│   │   └── auth.ts             # GitHub authentication
│   ├── socket/                 # WebSocket utilities
│   │   ├── client.ts           # Socket.io client setup
│   │   └── events.ts           # WebSocket event definitions for sync
│   └── utils/                  # General utilities
│       ├── debounce.ts         # Debounce utility for editor changes
│       └── url.ts              # URL parsing utilities
├── hooks/                       # Custom React hooks
│   ├── useAst.ts               # AST parsing and manipulation hook
│   ├── useWebContainer.ts      # WebContainer instance and operations
│   ├── useFileSystem.ts        # File system operations hook
│   ├── useFileSelection.ts     # Hook to manage shared file selection state
│   ├── useDesignView.ts        # React Flow state and operations for design view
│   ├── useReactFlow.ts         # React Flow integration with AST changes
│   ├── useCodeView.ts          # Monaco editor state for code view
│   └── useSocket.ts            # WebSocket connection and event handlers
├── context/                     # React context providers
│   ├── AppContext.tsx          # Main app context with global state
│   ├── FileTreeContext.tsx     # Shared file tree and selection state
│   ├── InitiativeContext.tsx   # Project initiative data and operations
│   ├── DesignContext.tsx       # React Flow state and AST visualization config
│   ├── CodeContext.tsx         # Editor state and open files tracking
│   └── WebContainerContext.tsx # WebContainer instance and filesystem state
├── types/                       # TypeScript type definitions
│   ├── ast.ts                  # AST node and tree types
│   ├── container.ts            # WebContainer types
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
├── wasm/                        # WebAssembly files
│   └── tree-sitter/            # Tree-sitter WASM files
│       ├── tree-sitter-javascript.wasm  # JavaScript grammar
│       ├── tree-sitter-typescript.wasm  # TypeScript grammar
│       ├── tree-sitter-tsx.wasm         # TSX grammar for React
│       └── tree-sitter-css.wasm         # CSS grammar
├── templates/                   # Project templates
│   ├── react-app/              # React application template
│   └── next-app/               # Next.js application template
└── fonts/                       # Custom fonts
```

## API Structure

### AI Chat API
- `POST /api/ai/chat` - Handles chat messages and AI responses with tool execution

### GitHub API
- `GET /api/github/repos` - List repositories for the authenticated user
- `POST /api/github/repo/load` - Load a GitHub repository into WebContainer
- `GET /api/github/repo/[owner]/[repo]/files` - Get repository files and structure

### WebSocket Endpoints
- `/api/socket` - Socket.IO connection endpoint for real-time collaboration
  - Events:
    - `code_change` - Notify about code changes
    - `ast_update` - Trigger AST re-parsing
    - `design_update` - React Flow canvas updates
    - `selection_change` - File/component selection changes

## React Flow Integration for AST Visualization

The React Flow integration for visualizing the AST happens through these key components:

1. **AST to Visual Mapping**:
   - `src/lib/ast/mapper.ts` converts AST nodes to React Flow nodes/edges
   - `src/lib/reactFlow/nodeTypes.ts` defines visual representations for components
   - `src/lib/reactFlow/layoutEngine.ts` handles automatic positioning

2. **React Flow Canvas**:
   - `src/components/design/Canvas.tsx` implements the main React Flow instance
   - `src/components/design/Nodes/` contains custom node components for different element types
   - `src/components/design/Edges/` contains custom edge components for relationships

3. **State Management**:
   - `src/hooks/useReactFlow.ts` manages React Flow state and operations
   - `src/hooks/useDesignView.ts` connects AST changes to visual updates
   - `src/context/DesignContext.tsx` provides design state to all components

4. **Synchronization**:
   - WebSocket events keep the AST and React Flow visualization in sync
   - File selection in the shared tree triggers appropriate design view updates

## App Architecture and Features

1. **Shared Left Panel**
   - Present across all tabs (Knowledge/Design/Code)
   - Contains Home link, Design System link, and File Tree
   - Selection in File Tree affects both Design and Code views
   - Managed by `FileTreeContext` and `useFileSelection` hook

2. **Design Mode**
   - When a folder is selected, displays all components/pages in React Flow canvas
   - Shows relationships between components visually using custom nodes and edges
   - Component selection shows properties in Inspector panel
   - AST is parsed and mapped to React Flow elements in real-time

3. **Code Mode**
   - Each selected file opens as a tab in Monaco editor
   - Multiple files can be open simultaneously with tab management
   - Traditional code editing experience with syntax highlighting
   - Changes to code trigger AST re-parsing

4. **File Tree and View Synchronization**
   - Shared file tree state between Design and Code views
   - WebSocket synchronization keeps views in sync
   - AST parsing translates code to visual components
   - Changes in either view propagate to the other

5. **Tabs System**
   - Knowledge tab: Documentation and project info
   - Design tab: Visual component relationships in React Flow
   - Code tab: Traditional code editing with Monaco

6. **AI Integration**
   - Chat interface for code assistance
   - Tools for automation and code generation
   - Intent-based actions for code and design manipulation
   - Access to AST and file system for intelligent operations

