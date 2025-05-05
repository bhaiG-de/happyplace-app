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

## Phase 3 – AST Core & Client-Side Parsing ☑ *(Needs Re-Implementation)*

*Goal: Re-establish AST capabilities using client-side **@babel/parser** parsing to avoid browser COEP/COOP limitations.*

| ID | Ticket | Status |
|----|--------|--------|
| **P3‑01** | Install client-side AST deps: `@babel/parser`. (Add `recast`, `prettier` if not covered in P5-01) | ☑ |
| **P3‑02** | Create client-side parsing utility (`lib/ast/parser.ts`) using `@babel/parser` with **JSX and TypeScript plugins** | ☑ |
| **P3‑03** | ~~Implement server-side parser logic~~ **(Removed)** | ⊗ |
| **P3‑04** | Refactor/Create `useAstRegistry` hook (client-side, using **Babel AST**) | ☑ |
| **P3‑05** | Implement `discoverSourceFiles` util (client-side, operates on Sandpack files) | ☑ |
| **P3‑06** | Implement logic in `useAstRegistry` to trigger client-side **@babel/parser** parsing & **instrumentation** (debounced) for single changed files | ☑ |
| **P3‑07** | Implement client-side AST storage (Map of **Babel AST File** objects) & **UID-to-ASTNode map** in `useAstRegistry` | ☑ |
| **P3‑08** | Hook `useAstRegistry` to Sandpack file changes to trigger client-side re-parsing & re-instrumentation | ☑ |

**Phase 3 Notes:**
- Shifts parsing back to the client using `@babel/parser`.
- P3-01: Add `@babel/parser`, `recast`, `prettier`, `nanoid` (or similar UUID lib) to `dependencies`. Ensure `@babel/plugin-syntax-jsx` and `@babel/plugin-syntax-typescript` are available or installed if not included with `@babel/parser` itself.
- P3-02: Utility (`lib/ast/parser.ts`) takes code string, returns **Babel AST File object**, configured with `jsx` and `typescript` plugins.
- P3-04: `useAstRegistry` hook manages client state (**Babel ASTs**, UID map, status) and orchestrates parsing (`lib/ast/parser.ts`) and instrumentation (`lib/ast/instrumentation.ts` - see P5-02b).
- P3-06: Parsing & instrumentation triggered *client-side* for changed files, debounced.
- P3-07: Hook stores both the full **Babel AST File** objects and the map linking injected `data-uid`s to **Babel AST nodes**.
- P3-09: Confirmed.

**Progress Notes:**
- Previous client-side WASM AST implementation was removed.
- This phase outlines rebuilding AST functionality using client-side **@babel/parser** parsing **and `data-uid` instrumentation**.

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
| **P5‑01** | Add/Confirm deps: `recast`, `prettier`, `nanoid` (or UUID lib) | ☑ |
| **P5‑02** | Design Mode Toggle: Implement UI element | ☑ |
| **P5‑02b**| **AST Instrumentation:** Implement AST traversal utility (`lib/ast/instrumentation.ts`) to inject `data-uid` into JSX elements & build UID-to-ASTNode map (called by `useAstRegistry`) | ☑ |
| **P5‑03** | ~~Preview Instrumentation (if needed)~~ **(Superseded by P5-02b)** | ⊗ |
| **P5‑04** | **Preview Interaction:** Implement click listener in Sandpack preview; read `data-uid`; `postMessage` UID to host app (Requires P6-07). | ☑ |
| **P5‑05** | **DOM-to-AST Mapping:** Use UID received from P5-04 to look up AST node in the UID-to-ASTNode map (from P5-02b). | ☑ |
| **P5‑06** | **Prop Extraction:** Traverse identified client-side **Babel AST node** (from P5-05) to extract component props & infer types. | ☑ |
| **P5‑07** | **Inspector UI:** Build panel (`src/components/design/Inspector.tsx`) to display/edit props using type-aware `shadcn/ui` controls. | ☑ |
| **P5‑08** | **AST Prop Patcher:** Create function (`applyPropPatch` in `lib/ast/patching.ts`) operating client-side on the **Babel AST node** (from P5-05). | ☑ |
| **P5‑09** | **Codegen & Save:** Use `recast`/`prettier` client-side, ensuring `data-uid` persists; save via Sandpack's `updateCode`. | ☐ |
| **P5‑10** | **E2E Test:** Verify full loop: toggle mode -> click (`data-uid`) -> inspect/edit -> save -> check code (`data-uid` present) & Sandpack preview update. | ☐ |
| **P5‑OLD‑05** | *(Low Priority)* Update Socket payloads to optionally send diffs? | ☐ |

**Phase 5 Notes:**
- Depends on the **client-side Babel AST registry and UID map (P3)**.
- Core mechanism is **`data-uid` injection** (implemented in `lib/ast/instrumentation.ts`, triggered by P3 hook - P5-02b) into JSX via AST transformation, creating a **map between UIDs and AST nodes**.
- **Editing Workflow:** Click in preview reads `data-uid` (P5-04) -> map lookup finds AST node (P5-05) -> props extracted & types inferred (P5-06) -> inspector shows `shadcn/ui` controls (P5-07) -> edits patch the AST node (P5-08) -> code regenerates *with UIDs* (P5-09) -> saved to Sandpack -> `useAstRegistry` reparses & **re-instruments with `data-uid`** (P3/P5-02b) to keep map consistent.
- P5-01: Dependencies confirmed/added during P3.
- P5-04: Implemented using `postMessage` for Preview -> Host communication.
- P5-06: `extractPropsFromNode` enhanced to return structured `ExtractedPropInfo` including inferred `PropType`.
- P5-07: `Inspector.tsx` implemented using inferred types to render appropriate `shadcn/ui` controls (`Input`, `Checkbox`, etc.). Local edit state managed.
- P5-08: `applyPropPatch` function created in `lib/ast/patching.ts` to mutate AST nodes based on `PropValue`.

**Progress Notes:**
- Inspection loop (Click -> UID -> AST Node -> Prop Extraction -> Display) is functional. ☑
- Hover effect & click interception added to preview. ☑
- **AST Prop Patcher (`applyPropPatch`) implemented.** ☑
- **Inspector UI significantly improved:** Uses `shadcn/ui` controls based on inferred prop types (color, boolean, number, string, unit, code). ☑
- Phase remains blocked by **P5-09 (Codegen & Save)** to complete the editing loop.

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

## Phase 7 – AI Agent Integration ☐ *(Partially Blocked by P3/P5)*

| ID | Ticket | Status |
|----|--------|--------|
| **P7‑01** | Install `ai`, `@ai-sdk/react`, provider SDK | ☐ |
| **P7‑02** | `/api/ai/chat` endpoint using `streamText` | ☐ |
| **P7‑03** | Define Zod schemas for tools: `readFile`, `editFile` | ☐ |
| **P7‑04** | Implement tool execution: `readFile` uses Sandpack state, `editFile` uses **client-side Babel AST** (P3) + **Recast/Prettier** (P5) + `updateCode` | ☐ |
| **P7‑05** | Chat UI components (`src/components/ai/Chat.tsx`, etc.) | ☐ |

**Phase 7 Notes:**
- P7-01, P7-02, P7-03, P7-05: Unchanged status.
- P7-04: Blocked by P3 (AST registry) and potentially P5 (codegen logic) for `editFile`. `readFile` can be implemented using only Sandpack state.

**Progress Notes:**
- AI tools requiring AST (`editFile`) are blocked by P3/P5 but are now planned to operate entirely client-side using **Babel AST**.
- Basic `readFile` tool can be implemented using Sandpack state.

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

