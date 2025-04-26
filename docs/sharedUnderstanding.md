# 21st Gen IDE – Shared Understanding (v0.1)

---
## 1 · “Start a New Initiative” – Intent‑Ingestion Hub
* **WOW first interaction** – a single prompt + artefact chips.
* **Figma screens → live prototype**  
  * We pipeline every selected Figma frame into a working React page (layout & navigation inferred).
* **GitHub branch boot‑strap**  
  * Create a new branch off `main` for the initiative.
  * Immediately crawl the repo to populate a **Knowledge Graph / embedding store** that improves AI answers.
* **Docs enrichment** – ingest linked PRDs/MD/GDocs to deepen context.
* **Backend actions**  
  1. Persist a `Workspace` / `Initiative` object.  
  2. Spawn a **multi‑tool agent** (Vercel AI SDK) tied to a persistent `ChatSession`.

---
## 2 · Design Mode – Visual‑DOM ⇄ Code Bridge (our differentiator)
* **Canvas = live visual‑DOM** that mirrors the codebase.
* **Left rail → Layers / File‑scope switcher**  
  * Selecting e.g. `src/ui/homepage/` renders *every* page in that folder as editable nodes.
* **Nodes** are React‑Flow wrappers around real components/pages; **edges** show inter‑component/page links.
* **Right‑hand Inspector** surfaces props derived from the AST; edits are written *surgically* back to code.
* **Promotion path**  
  * Free‑form elements become AST‑linked when they gain structure, content binding, or are grouped as a Component.

---
## 3 · Code Mode – Familiar Editor, Live‑Synced
* Initially a forked VS Code (WebContainer) for solid UX.
* No AST UI here – just source files.
* **Two‑way sync:** as the AI (or human) edits files, the underlying AST updates, which in turn updates the Design canvas in real time.

---
## 4 · Interactive Shareable Preview
* One‑click shareable URL.
* Spins up a **WebContainer** file system pointing at the current initiative branch.
* Stakeholders see and interact with the real build artefact, live‑reloading on every save.

---
## 5 · AI Implementation Model
* **Vercel AI SDK “Assistant with Tools”.**  
  * Tools: `readFile`, `editFile`, `readFigma`, `queryGraphDB`, …
* **Single omnipresent agent** across Design & Code tabs.  
  * Executes tools autonomously to fulfil user intents.  
  * When it writes code in Code Mode, changes propagate instantly to Design Mode, creating the “magic” effect.

---
## 6 · Data & Sync Loop (high‑level)
```
User Prompt → Agent Tasks → Tool Invocations → Code / Graph Updates
          ↑                                          ↓
     ChatSession UI            ⬄        Canvas / Editor Live Sync
```
* **CRDT / Socket layer** keeps Design canvas, Code editor, and Preview in lock‑step.
* **Embedding store + Graph** fuels semantic search for the assistant.

---
### Next Steps
1. Confirm this shared map matches your intent.
2. Decompose into concrete service boundaries & schema.
3. Spike the multi‑tool assistant flow inside Vercel AI SDK (prompt ↔ tools ↔ code write).

