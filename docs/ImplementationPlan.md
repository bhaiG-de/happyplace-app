# Implementation Plan v0.3 — **Sandpack Migration**

> *This supersedes Implementation Plan v0.2.*
> Reflects migration from `@webcontainer/api` to `@codesandbox/sandpack-react`.

---

## 🔄 Key Changes from v0.2

| Area                 | Change                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Runtime**          | Replaced **WebContainer (`@webcontainer/api`)** with **Sandpack (`@codesandbox/sandpack-react`)**.             |
| **Execution Model**  | Shifted from running user's dev server (`webContainer.spawn`) to **Sandpack's internal bundler/preview**.      |
| **File System**      | Replaced WebContainer VFS (`webContainer.fs`) with **Sandpack state management** (`files` prop, `updateCode` hook). |
| **Phase 2**          | Refocused on **Sandpack setup and file handling adaptation**.                                                  |
| **Phase 6**          | Redefined as **Interactive Preview via Sandpack**, removing direct execution steps (install, spawn).           |
| **AST Integration**  | **Temporarily Removed:** Tree-sitter/AST parsing removed due to COEP header conflicts. Needs re-implementation compatible with Sandpack. |
| **Code Generation**  | Phase 5/7 edits will use `recast` + `prettier` + **Sandpack's `updateCode`** for saving (when AST is restored). |
| **Preview**          | Uses `<SandpackPreview>` component. **Preview is working successfully.**                                       |
| **Communication**    | Leverages **Sandpack's client API** for `postMessage` between host and preview iframe (when needed for Phase 5). |
| **Headers**          | COOP/COEP headers in `next.config.ts` removed as Tree-sitter is temporarily disabled.                          |

---

## Phase 1 – Core Infrastructure & Public GitHub Loading *(completed)*
_No scope changes; retained for completeness._

1. Next.js + Tailwind scaffold
2. Radix UI / shadcn primitives (Button, Input)
3. GitHub unauthenticated repo fetch (Octokit)
4. Monaco Editor embed
5. ~~COOP/COEP headers for WebContainer compatibility~~ **Removed** (as Tree-sitter removed)

---

## Phase 2 – **Sandpack Integration & File Management** *(Mostly Complete)*

| Task                            | Output                                                                                                |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Install Sandpack deps           | `@codesandbox/sandpack-react` added, `@webcontainer/api` removed.                                        |
| Implement `<SandpackProvider>`  | Root provider setup with appropriate template and initial `files` prop.                            |
| Adapt GitHub loading            | Fetched files loaded into the `files` prop of `<SandpackProvider>`.                                      |
| Refactor FS Helpers             | `readFile`, `writeFile` mapped to Sandpack state/hooks (`useSandpack`, `useActiveCode`, `updateCode`). |
| Adapt Editor Integration        | Editor uses `useActiveCode` to display and `updateCode` to save changes. *(Custom Monaco pending)*       |
| Implement `SandpackLayout`      | Use components like `<SandpackCodeEditor>`, `<SandpackPreview>`, `<SandpackFileExplorer>`.              |
| **File Update Handling**        | **Deferred:** Depends on AST registry re-implementation.                                                |

---

## Phase 3 – **AST Core & Server-Side Parsing** *(Needs Re-Implementation)*

### Goal
Re-implement AST Registry compatible with Sandpack by shifting parsing to the server, thus avoiding browser COEP/COOP security constraints related to WASM/SharedArrayBuffer.

### Deliverables
- **Server-Side:**
    - Node.js Tree-sitter dependencies (`tree-sitter`, grammars) added to `package.json`.
    - API endpoint (`/api/ast/parse`) that receives **single file** code + language, uses Node Tree-sitter to parse, and returns a JSON representation of the AST (or relevant parts).
- **Client-Side:**
    - `web-tree-sitter` dependency removed.
    - `/public/wasm` directory removed.
    - `useAstRegistry` hook (or equivalent) refactored/created:
        - Manages client-side state: Map to store ASTs (received as JSON from API), parsing status (idle, fetching, ready, error), error messages.
        - Identifies relevant source files from Sandpack state (`sandpack.files`).
        - Calls the `/api/ast/parse` endpoint for **single changed files only** when Sandpack files change.
        - **Debounces** API calls triggered by frequent changes (e.g., editor typing).
        - Updates the client-side AST map (file-by-file) with results from the API.
- *Deferred:* Jest tests for API endpoint and client hook.

### Pipeline (Server-Side Parsing for Registry Sync)
```mermaid
graph TD
  A[Sandpack File Change Event (via updateCode)] --> B(Client: useAstRegistry Hook)
  B --> |Debounce Timer| B
  B --> C(Client: Identify Changed File)
  C --> |API Request (single file code, lang)| D{Server: /api/ast/parse}
  D --> |Parse w/ Node Tree-sitter| D
  D --> |API Response (AST JSON)| B
  B --> E{Client: Update AST Registry Map (for changed file)}
  E --> |AST for analysis| F(Code Intel / Editor)
  E --> |AST for edits| G(Design Canvas / Phase 5)
```

---

## Phase 4 – Design Mode: Isolated Vite Preview *(Skipped/Obsolete)*

> **Reason for Skip:** This approach involved creating a separate Vite application (`/preview-app`) to render components in isolation. It introduced complexities with build configuration, aliasing, and maintaining synchronization. The strategy pivoted to running the user's *actual* development server directly within the WebContainer (now covered in Phase 6), providing a more realistic and integrated preview experience.

---

## Phase 5 – **Design Mode & AST-Based Edits** *(Depends on P3)*

*Implement interactive visual editing backed by AST manipulation within the Sandpack context.*

**Depends on Phase 3:** Requires the client-side AST registry populated via the server-side parsing API.

**Goal:** Allow users to click elements in the **Sandpack preview**, inspect/edit props using data derived from the **client-side AST registry**, perform AST patching and code generation **on the client**, and save changes back using **Sandpack's `updateCode`**. The save then triggers the Phase 3 mechanism to update the AST registry via the server API for consistency.

**Workflow (Client-Side Edits + Server Sync):**
1. Activate Design Mode.
2. Element Selection in Sandpack Preview (Requires instrumentation + `postMessage`).
3. DOM-to-AST Mapping (Uses **client-side AST registry** from Phase 3).
4. Prop Extraction (Uses **client-side AST registry**).
5. Inspector Panel.
6. Apply Changes.
7. **Client-Side AST Patching:** Modify the AST object held in the client-side registry (e.g., using `recast`).
8. **Client-Side Code Generation:** Generate new source code string for the modified file (e.g., using `recast`/`prettier`).
9. **Write File (Client):** Save the new code string to Sandpack state via `updateCode` hook.
10. **Sandpack Sync:** `updateCode` triggers Sandpack state change -> HMR updates preview.
11. **AST Registry Sync (Phase 3 Trigger):** The file change detected by `useAstRegistry` (from step 9) triggers a **debounced API call** to `/api/ast/parse` with the new code for the **single changed file**, updating the client-side AST registry map to match the new reality.
12. Deactivate mode.

| Layer          | Detail                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------- |
| **Deps**       | `recast`, `@babel/parser`, `prettier`                                                             |
| **Interaction**| `postMessage` (Sandpack client API), DOM listeners, Element ID (data-attrs?)                      |
| **Mapping**    | DOM element ID → AST Node (**using client-side AST from P3**)                                        |
| **AST Edit**   | Find node, modify props (**operating client-side** on AST from registry)                           |
| **Code‑gen**   | `lib/ast/codegen.ts` → `printAst` (**client-side**)                                              |
| **Saving**     | Use **`updateCode`** from Sandpack's `useActiveCode` hook.                                         |
| **AST Sync**   | **Client-side** `useAstRegistry` hook calls **server** API (`/api/ast/parse`) post-save for consistency. |
| **UI**         | Design Mode toggle, Inspector Panel                                                                 |
| **E2E**        | Test full loop: click → edit → save → verify code state & **Sandpack preview** update.            |

---

## Phase 6 – **Interactive Preview via Sandpack** *(Complete)*

*Leverages Sandpack's built-in bundler and preview component.* 

1.  **Setup `<SandpackProvider>`:** **Done.** Configured with project `files`, template. Dependencies handled. 
2.  **Render `<SandpackPreview>`:** **Done.** Preview is working. ✅
3.  **Enable Iframe Communication:** **Deferred.** Depends on Phase 5 implementation. 
4.  **HMR:** **Pending Verification.** Depends on Phase 5 edits via `updateCode`.

*Obsolete Steps (Handled by Sandpack):*
- Reading `package.json` for scripts/manager.
- Running `npm install`.
- Spawning the dev server process.
- Capturing the preview URL.

---

## Phase 7 – AI Agent Integration *(Blocked)*

*Leverages Sandpack for file operations.* 

**Blocked:** The `editFile` tool requires AST functionality (Phase 3).

- Tools:
    - `readFile`: Reads content from Sandpack state (`sandpack.files`). *(Potentially implementable)*
    - `editFile`: Uses AST Registry + Code‑gen (Phase 5 `printAst`) + **Sandpack's `updateCode`** for saving. *(Blocked)*
- Chat endpoint/UI remain the same.

---

## Phase 8 – Advanced / Backlog *(placeholders)*

*No changes*

---

## File‑Structure Adjustments *(Reflecting Temporary Removals)*

```
src/
  components/
    design/
      Inspector.tsx     # (Phase 5 - Unchanged, currently blocked)
+   sandpack/         # Optional: Custom Sandpack wrapper components?
  hooks/
-   useAstRegistry.ts # Temporarily Removed
-   useAst.ts         # Temporarily Removed (if existed separately)
-   useWebContainer.ts  # Removed
-   useFileSystem.ts    # Replaced/Refactored for Sandpack
  context/
-   WebContainerContext.tsx # Removed
-   AstRegistryContext.tsx  # Temporarily Removed
  lib/
    ast/              # (Temporarily Removed / Inactive)
-     parser.ts       # Temporarily Removed
-     traversal.ts    # Inactive (depends on parser)
-     mapper.ts       # Inactive (depends on parser)
-     codegen.ts      # Inactive (depends on parser)
-   container/        # Removed (WebContainer specific)
+   sandpack/         # NEW: Helpers for Sandpack interaction?
      files.ts        # (Example: Adapted FS helpers)
  ...
```

---

## Dependencies (Relevant - Reflecting Removals)

```json
{
  "dependencies": {
    "@codesandbox/sandpack-react": "^2.20.0", 
  // "web-tree-sitter": "^0.25.3", // Temporarily Removed
    "recast": "^0.23", // For future AST edits
    "prettier": "^3.3", // For future AST edits
    // ... other deps
  },
  "devDependencies": {
  // "path-browserify": "^1.0.1", // Temporarily Removed
    // ...
  }
}
```

---

### Migration Notes

- Sandpack preview is now functional after removing Tree-sitter and related COEP/COOP headers.
- **Next major step is re-implementing AST parsing** (Phase 3) in a way that is compatible with Sandpack and browser security policies.
- File system operations are now state management operations on the Sandpack `files` prop/state.

---

_End of Implementation Plan v0.3 (Sandpack Migration)_ 

