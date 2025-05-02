# Development Tickets — **v0.3 (Sandpack Migration)**

> *Derived from **Implementation Plan v0.3 (Sandpack Migration)**. Reflects pivot from WebContainer to Sandpack.*

---

## Legend
- `☑` = completed (merged to `main`)
- `☐` = not started / in progress
- `⊗` = obsolete / skipped
- `↩️` = temporarily reverted / needs re-implementation

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

---

## Phase 2 – **Sandpack Integration & File Management** ✅ *(Replaces WebContainer)*

| ID | Ticket | Status |
|----|--------|--------|
| **P2‑01** | Install `@codesandbox/sandpack-react` | ☑ |
| **P2‑02** | Replace `WebContainerContext`/`useWebContainer` with `<SandpackProvider>` | ☑ |
| **P2‑03** | Refactor filesystem helpers (`src/lib/container/*` -> Sandpack state) | ☑ |
| **P2‑04** | Wire editor (`src/components/code/Editor.tsx`) to Sandpack state (`useActiveCode`) | ☐ |
| **P2‑05** | Load fetched repo into `<SandpackProvider files={...}>` prop | ☑ |
| **P2‑06** | Adapt AST registry (`useAstRegistry`) to Sandpack file state | ↩️ |
| **P2‑07** | Docs: "Using Sandpack for File Management" section | ☐ |

**Phase 2 Notes:**
- P2-01: Removed `@webcontainer/api`. Added `@codesandbox/sandpack-themes`.
- P2-02: Implemented in `instance/[id]/page.tsx`. Configured template.
- P2-03: Old helpers removed. Reads via `useSandpack`, writes via `useActiveCode`.
- P2-04: Placeholder `InstanceEditor` uses Sandpack's editor implicitly. Custom Monaco integration using `useActiveCode` still needed.
- P2-05: Using `fetchRepoDataForSandpack`.
- P2-06: **Temporarily Removed:** AST hook (`useAstRegistry`), parser (`lib/ast/parser`), and WASM files removed to resolve COEP conflict blocking Sandpack preview. Needs re-implementation.

**Progress Notes:**
- Core Sandpack integration complete, including provider setup and file loading.
- Sandpack preview is **successfully running**. ✅
- **AST registry/parsing temporarily removed** due to COEP header conflict. Needs re-implementation.
- Custom editor integration (P2-04) and documentation (P2-07) remain.

---

## Phase 3 – AST Core & Server-Side Parsing ☐ *(Needs Re-Implementation)*

*Goal: Re-establish AST capabilities by parsing code on the server to avoid browser COEP/COOP limitations.*

| ID | Ticket | Status |
|----|--------|--------|
| **P3‑01** | Install Node Tree-sitter deps (`tree-sitter`, `tree-sitter-javascript`, `tree-sitter-typescript`, `tree-sitter-tsx`) | ☐ |
| **P3‑02** | Create API endpoint (`/api/ast/parse`) for single-file parsing | ☐ |
| **P3‑03** | Implement server-side parser logic in API endpoint (accept single file code/language, return AST JSON) | ☐ |
| **P3‑04** | Refactor/Create `useAstRegistry` hook (client-side) | ☐ |
| **P3‑05** | Implement `discoverSourceFiles` util (client-side, operates on Sandpack files) | ☐ |
| **P3‑06** | Implement logic in `useAstRegistry` to call `/api/ast/parse` (debounced) for **single changed files** | ☐ |
| **P3‑07** | Implement client-side AST storage (Map) in `useAstRegistry` | ☐ |
| **P3‑08** | Hook `useAstRegistry` to Sandpack file changes to trigger re-parsing via API | ☐ |
| **P3‑09** | Remove client-side WASM files (`/public/wasm`) and `web-tree-sitter` dep (if not already done) | ☑ |
| **P3‑10** | Unit tests: API endpoint parsing, client-side registry logic *(Deferred)* | ☐ |

**Phase 3 Notes:**
- This approach shifts parsing from the client (WASM) to the server (Node.js) via an API.
- P3-01: Add these to `devDependencies` in `package.json`.
- P3-02: Define request/response format (e.g., `{ code: string, language: string }` -> `{ astJson: object | null, error?: string }`). Endpoint designed for **single files** to keep payload small.
- P3-03: Use Node Tree-sitter bindings on the server to parse the provided code snippet.
- P3-04: Manages client-side state (AST map, status, errors) and API interaction.
- P3-06: **Crucially**, API calls are made only for the specific file that changed in Sandpack state, not the whole project. Calls from editor changes should be **debounced**.
- P3-07: Store potentially simplified JSON representations of the AST to avoid large client memory usage. Registry updated file-by-file based on API responses.
- P3-09: Confirmed.

**Progress Notes:**
- Previous client-side AST implementation was removed.
- This phase outlines the steps to rebuild AST functionality using server-side parsing.

---

## Phase 4 – Design Mode – Isolated Vite Preview ⊗ *(Skipped)*

> **Note:** This entire phase is obsolete due to the pivot to direct execution in Phase 6.

| ID | Ticket | Status |
|----|--------|--------|
| **P4‑01** | ~~Remove legacy map‑build logic; import from `componentMapGenerator.ts`~~ | ⊗ |
| **P4‑02** | ~~Generate `/preview-app` scaffold & alias `@user-project`~~ | ⊗ |
| **P4‑03** | ~~Write dynamic `componentMap.js` into `/preview-app/src`~~ | ⊗ |
| **P4‑04** | ~~`PreviewLoader.tsx` – dynamic import via URL query~~ | ⊗ |
| **P4‑05** | ~~Iframe wrapper `ComponentPreview.tsx` (uses `inverseMap`)~~ | ⊗ |
| **P4‑06** | ~~postMessage listener for `componentMapUpdated` -> reload iframe~~ | ⊗ |
| **P4‑07** | ~~Verify *preview app* Vite HMR when code edits occur~~ | ⊗ |

---
## Phase 5 – Design Mode & AST-Based Edits ☐ *(Adaptation Required / Depends on P3)*

| ID | Ticket | Status |
|----|--------|--------|
| **P5‑01** | Add deps: `recast`, `@babel/parser`, `prettier` | ☐ |
| **P5‑02** | Design Mode Toggle: Implement UI element | ☐ |
| **P5‑03** | **Preview Instrumentation (if needed):** Add mechanism to identify elements in Sandpack preview | ☐ |
| **P5‑04** | **Preview Interaction:** Implement click listener in Sandpack preview; `postMessage` selected element identifier to host app (Requires P6-07 equivalent). | ☐ |
| **P5‑05** | **DOM-to-AST Mapping:** Develop logic to map element identifier from P5-04 back to its source AST node (using client-side AST from P3). | ☐ |
| **P5‑06** | **Prop Extraction:** Traverse identified AST node (from P5-05) to extract component props. | ☐ |
| **P5‑07** | **Inspector UI:** Build panel (`src/components/design/Inspector.tsx`) | ☐ |
| **P5‑08** | **AST Prop Patcher:** Create function (`applyPropPatch`?) (operates **client-side** on AST from registry). | ☐ |
| **P5‑09** | **Codegen & Save:** Use `lib/ast/codegen.ts` (`printAst`) (**client-side**) and **Sandpack's `updateCode`** | ☐ |
| **P5‑10** | **E2E Test:** Verify full loop: toggle mode -> click -> inspect/edit -> save -> check code & Sandpack preview update (via Sandpack HMR). | ☐ |
| **P5‑OLD‑05** | *(Low Priority)* Update Socket payloads to optionally send diffs? | ☐ |

**Phase 5 Notes:**
- This phase now depends on the **client-side AST registry populated by the server API (Phase 3)**.
- **Editing Workflow:** Visual edits trigger **client-side** AST patching (P5-08) and code generation (P5-09). The *result* is saved to Sandpack via `updateCode`. This save triggers the Phase 3 hook (P3-08) to call the API (P3-06, debounced) with the new code for the *single changed file* to update the client AST registry for consistency.
- P5-05, P5-06, P5-08: Logic operates on the AST data fetched from the server and stored by `useAstRegistry`.
- P5-09: Code generation happens client-side.
- P5-03, P5-04: Still require investigation into Sandpack preview communication.

**Progress Notes:**
- Phase remains blocked until Phase 3 (AST Core) is re-implemented.

---

## Phase 6 – **Interactive Preview via Sandpack** ✅

| ID | Ticket | Status |
|----|--------|--------|
| **P6‑01** | ~~Read `package.json` & Detect Script~~ | ⊗ |
| **P6‑01b**| ~~Detect Package Manager~~ | ⊗ |
| **P6‑01c**| ~~Install Dependencies~~ | ⊗ |
| **P6‑03** | ~~Spawn Dev Server~~ | ⊗ |
| **P6‑04** | Use `<SandpackPreview>` component to display preview | ☑ |
| **P6‑05** | Verify Sandpack HMR triggered by `updateCode` (from P5-09). | ☐ |
| **P6‑06** | (Optional) Generate shareable preview link placeholder. | ☐ |
| **P6‑07** | **NEW:** Implement `postMessage` communication **from** Sandpack preview iframe **to** host application (using Sandpack client API). | ☐ |

**Phase 6 Notes:**
- P6-01, P6-01b, P6-01c, P6-03: Handled by Sandpack.
- P6-04: Implemented in `instance/[id]/page.tsx`. **Preview is working.** ✅
- P6-05: Blocked by P5-09 (AST edits).
- P6-06: Unchanged.
- P6-07: Needed for P5-04 click events. *(Blocked by P5-04)*

**Progress Notes:**
- Sandpack preview environment is successfully set up and running.
- HMR (P6-05) and iframe communication (P6-07) are pending Phase 5 integration (blocked by AST removal).

---

## Phase 7 – AI Agent Integration ☐ *(Adaptation Required / Blocked)*

| ID | Ticket | Status |
|----|--------|--------|
| **P7‑01** | Install `ai`, `@ai-sdk/react`, provider SDK | ☐ |
| **P7‑02** | `/api/ai/chat` endpoint using `streamText` | ☐ |
| **P7‑03** | Define Zod schemas for tools: `readFile`, `editFile` | ☐ |
| **P7‑04** | Implement tool execution: `readFile` uses Sandpack state, `editFile` uses AST + `updateCode` (P5-09) | ☐ |
| **P7‑05** | Chat UI components (`src/components/ai/Chat.tsx`, etc.) | ☐ |

**Phase 7 Notes:**
- P7-01, P7-02, P7-03, P7-05: Unchanged status.
- P7-04: Blocked by AST removal for `editFile`. `readFile` could potentially be implemented.

**Progress Notes:**
- AI tools requiring AST (`editFile`) are blocked.
- Basic `readFile` tool could potentially be implemented using Sandpack state.

---

## Phase 8 – Advanced Features & Refinements ☐

| Possible Workstream | Notes |
|---------------------|-------|
| **Intent‑Ingestion Hub** | Figma import, enhanced GitHub PR sync, doc ingestion |
| **Knowledge Graph / Embeddings** | Project‑wide semantic search |
| **Design Mode UX** | Auto‑layout refinement, component grouping |
| **Collaboration** | Cursor presence, live comments |
| **Perf & Testing** | WebContainer cold‑boot profiling, unit + E2E suites |

---

## Backlog / Nice‑to‑haves
- Visual diff UI for AST patch results.
- Spectator mode for preview iframe.
- More robust error handling for AST mapping/patching.

