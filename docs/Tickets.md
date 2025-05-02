# Development Tickets — **v0.2 (Comprehensive)**

> *Derived from **Implementation Plan v0.2 – AST-centric**. Every phase appears, even if unchanged from v0.1.*

---

## Legend
- `☑` = completed (merged to `main`)
- `☐` = not started / in progress

---

## Phase 1 – Core Infrastructure & Public GitHub Loading  ✅

| ID | Ticket | Status |
|----|--------|--------|
| **P1‑01** | **Project setup:** scaffold Next.js app (`create-next-app`) | ☑ |
| **P1‑02** | **Tailwind config:** install + custom tokens in `tailwind.config.ts` | ☑ |
| **P1‑03** | **Headless UI:** install Radix UI + shadcn/ui generator | ☑ |
| **P1‑04** | **Shared primitives:** build `Button`, `Input` in `src/components/shared` | ☑ |
| **P1‑05** | **UI shell:** root layout (`src/app/layout.tsx`), header (`src/components/core/Header.tsx`), GitHub‑URL landing page (`src/app/page.tsx`) | ☑ |
| **P1‑06** | **GitHub unauth fetch:** repo tree/blob via `octokit`; PAT env fallback (Implement in `src/lib/github/repo.ts`) | ☑ |
| **P1‑07** | **Monaco Editor:** basic embed `src/components/code/Editor.tsx` | ☑ |
| **P1‑08** | **Temporary file read:** show fetched file in editor | ☑ |
| **P1‑09** | **COOP/COEP headers** in `next.config.js` (WebContainer prep) | ☑ |

---

## Phase 2 – WebContainer & Virtual FS  🔧

| ID | Ticket | Status |
|----|--------|--------|
| **P2‑01** | Install `@webcontainer/api` | ☑ |
| **P2‑02** | Boot instance via `useWebContainer` provider (`src/hooks/useWebContainer.ts`, `src/context/WebContainerContext.tsx`) | ☑ |
| **P2‑03** | Implement fs helpers: `mount`, `readFile`, `writeFile`, `mkdir`, `rm` (in `src/lib/container/filesystem.ts`) | ☑ |
| **P2‑04** | Wire editor (`src/components/code/Editor.tsx`) to VFS (`src/hooks/useFileSystem.ts`) | ☑ |
| **P2‑05** | Mount fetched repo into `/project` (using `src/lib/container/filesystem.ts`) | ☑ |
| **P2‑06** | **NEW:** add `watchDirectory()` + `useFileWatcher` hook for live change events (likely `src/lib/container/filesystem.ts`, `src/hooks/useFileSystem.ts`) | ☑ |
| **P2‑07** | Docs: "Watching files in WebContainer" section | ☐ |

**Progress Notes:**
- ✅ Installed `@webcontainer/api` package
- ✅ Created WebContainer provider and hook for managing the instance
- ✅ Implemented filesystem helpers with proper TypeScript types
- ✅ Set up routing to instance page with dynamic `[id]` parameter
- ✅ Wired editor to VFS and mounted fetched repo into `/project`
- ✅ Implemented file watching functionality with `useFileWatcher` hook
- ✅ Implemented FileTree UI component and integrated it with the code editor for file selection and preview. The UI now matches the wireframe and file structure plan.
- ✅ Fixed file selection logic to prevent errors when selecting directories in FileTree.
- **Note:** A long-term solution would be to implement the FileTree component from the file structure plan, allowing users to select any file and removing the need for a hardcoded path.

---

## Phase 3 – **AST Core & Component Indexer** 

| ID | Ticket | Status |
|----|--------|--------|
| **P3‑01** | Copy `tree-sitter-javascript.wasm` & `tree-sitter-tsx.wasm` into `/public/wasm/tree-sitter` | ☑ |
| **P3‑02** | `getParser(ext)` helper in `src/lib/ast/parser.ts` | ☑ |
| **P3‑03** | `useAstRegistry` hook + context (`src/hooks/useAstRegistry.ts`, `src/context/AppContext.tsx`?) | ☑ |
| **P3‑04** | `discoverSourceFiles()` util (recursive) (potentially in `src/lib/ast/traversal.ts`) | ☑ |
| **P3‑05** | Initial parse of all source files -> registry (Uses `parser.ts`, `traversal.ts`, state in `useAstRegistry.ts`) | ☑ |
| **P3‑06** | Hook registry (`useAstRegistry.ts`) to `useFileWatcher` (`useFileSystem.ts`) for incremental updates | ☐ |
| **P3‑07** | `componentMapGenerator.ts` (export `componentMap` + `inverseMap`) in `src/lib/ast/componentMapGenerator.ts` | ☑ |
| **P3‑08** | Unit tests: parser bootstrap, anonymous export fallback, map refresh (Tests for `src/lib/ast/`) | ☐ |

**Progress Notes:**
- ✅ Implemented `parser.ts` with `initializeParser`, `getParser`, `parseSource`, handling WASM loading and language caching.
- ✅ Implemented `traversal.ts` with `discoverSourceFiles` to recursively find source files in the VFS.
- ✅ Created `AstRegistryContext.tsx` and `useAstRegistry.ts` hook.
- ✅ Provider performs initial scan/parse of discovered files into the registry.
- ✅ Integrated `AstRegistryProvider` into root layout.
- ✅ Hooked AST registry (`AstRegistryContext`) to file watcher (`useFileSystem`) for incremental updates (P3-06).
- ✅ Implemented `componentMapGenerator.ts` using Tree-sitter queries to find default exports and build component/inverse maps (P3-07).
- **Note:** Unit tests (P3-08) require manual setup of a testing environment (e.g., Vitest) and mocks for WebContainer/Tree-sitter APIs.
- **Note:** File watcher integration includes a workaround (`as any`) for potential type mismatches in `@webcontainer/api` watcher disposal.

---

## Phase 4 – Design Mode – Isolated Vite Preview 

| ID | Ticket | Status |
|----|--------|--------|
| **P4‑01** | Remove legacy map‑build logic; import from `src/lib/ast/componentMapGenerator.ts` | ☑ |
| **P4‑02** | Generate `/preview-app` scaffold & alias `@user-project` (using `src/lib/container/filesystem.ts`, `process.ts`) | ☑ |
| **P4‑03** | Write dynamic `componentMap.js` into `/preview-app/src` (using `componentMapGenerator.ts` output and `filesystem.ts`) | ☑ |
| **P4‑04** | `PreviewLoader.tsx` – dynamic import via URL query (in `/preview-app/src/PreviewLoader.tsx`) | ☑ |
| **P4‑05** | Iframe wrapper `src/components/preview/ComponentPreview.tsx` (uses `inverseMap` from `componentMapGenerator.ts`) | ☑ |
| **P4‑06** | **NEW:** postMessage listener for `componentMapUpdated` -> reload iframe (in `ComponentPreview.tsx`) | ☑ |
| **P4‑07** | Verify Vite HMR when code edits occur | ☐ |

**Progress Notes:**
- ✅ Confirmed reliance on Phase 3 `componentMapGenerator.ts` (P4-01).
- ✅ Implemented `setupPreviewApp` function (`src/lib/preview/setup.ts`) to generate `/preview-app` VFS structure, Vite config, base files (P4-02).
- ✅ `setupPreviewApp` dynamically generates `/preview-app/src/componentMap.js` using AST registry output (P4-03).
- ✅ Implemented `PreviewLoader.tsx` (within `setupPreviewApp`) to load components dynamically based on URL query param `?componentName=` using the generated `componentMap.js` (P4-04).
- ✅ Created `ComponentPreview.tsx` iframe wrapper component in the main app (`src/components/preview/`) which uses `inverseMap` from `useAstRegistry` to determine the component name and set the iframe `src` (P4-05).
- ✅ Added `postMessage` listener to `ComponentPreview.tsx` to handle `componentMapUpdated` events and trigger iframe reload via key change (P4-06).
- **Note:** Integration points (calling `setupPreviewApp`, posting `componentMapUpdated`, running Vite server, displaying `ComponentPreview`) and HMR verification (P4-07) are pending.

---

## Phase 5 – Code ↔ Design Sync & Inspector 

| ID | Ticket | Status |
|----|--------|--------|
| **P5‑01** | Add deps: `recast`, `@babel/parser`, `prettier`, `chokidar` | ☐ |
| **P5‑02** | `src/lib/ast/codegen.ts` → `printAst(tree)` w/ Prettier | ☐ |
| **P5‑03** | `applyCanvasPatch(patch)` – AST mutate → write file (likely in `src/lib/ast/codegen.ts` or a new sync lib, uses `filesystem.ts`) | ☐ |
| **P5‑04** | Refactor Inspector (`src/components/design/Inspector.tsx`) to use `applyCanvasPatch` (drop string replace) | ☐ |
| **P5‑05** | Update Socket payloads (`src/lib/socket/events.ts`) to optionally send file diffs | ☐ |
| **P5‑06** | E2E test: canvas edit → hot‑reload preview & editor sync | ☐ |

---

## Phase 6 – Interactive Preview & Execution  

| ID | Ticket | Status |
|----|--------|--------|
| **P6‑01** | `src/lib/container/process.ts` helper: spawn dev server (`npm run dev`) | ☐ |
| **P6‑02** | UI button "Run Dev Server" in toolbar (`src/components/core/Header.tsx` or `CanvasToolbar.tsx`?) | ☐ |
| **P6‑03** | Listen for `server-ready` event → capture preview URL (in `src/lib/container/process.ts` listener) | ☐ |
| **P6‑04** | `src/components/preview/LivePreview.tsx` iframe -> preview URL | ☐ |
| **P6‑05** | Ensure Vite/Next HMR handles FS writes; fallback websocket `preview_refresh` (`src/lib/socket/events.ts`) | ☐ |
| **P6‑06** | (Optional) Generate shareable preview link placeholder (`src/components/preview/ShareablePreview.tsx`?) | ☐ |

---

## Phase 7 – AI Agent Integration 

| ID | Ticket | Status |
|----|--------|--------|
| **P7‑01** | Install `ai`, `@ai-sdk/react`, provider SDK | ☐ |
| **P7‑02** | `/api/ai/chat` endpoint using `streamText` (in `src/app/api/ai/chat/route.ts`?) | ☐ |
| **P7‑03** | Define Zod schemas for tools: `readFile`, `editFile` (in `src/lib/ai/tools.ts`) | ☐ |
| **P7‑04** | Implement tool execution with AST‑safe `editFile` (in `src/lib/ai/agent.ts`, uses `codegen.ts`, `filesystem.ts`) | ☐ |
| **P7‑05** | Chat UI components (`src/components/ai/Chat.tsx`, `src/components/ai/ChatMessage.tsx`) | ☐ |

---

## Phase 8 – Advanced Features & Refinements
*(Place‑holders carried over; scope to be broken into tickets later)*

| Possible Workstream | Notes |
|---------------------|-------|
| **Intent‑Ingestion Hub** | Figma import, enhanced GitHub PR sync, doc ingestion |
| **Knowledge Graph / Embeddings** | Project‑wide semantic search |
| **Design Mode UX** | Auto‑layout refinement, component grouping |
| **Collaboration** | Cursor presence, live comments |
| **Perf & Testing** | WebContainer cold‑boot profiling, unit + E2E suites |

---

## Backlog / Nice‑to‑haves
- Auto‑generate Storybook stories from `componentMap`.
- Visual diff UI for `applyCanvasPatch` results.
- Spectator mode for preview iframe.

