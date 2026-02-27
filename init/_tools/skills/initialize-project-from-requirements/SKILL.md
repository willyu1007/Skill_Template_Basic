---
name: initialize-project-from-requirements
description: Use only in repos that still include the `init/` bootstrap kit to produce Stage A/B/C artifacts, update skill pack selection, and sync provider skill wrappers.
---

# Initialize a Project From Requirements

## Purpose

Turn an early project idea into **verifiable, file-based** outputs:

- **Stage A (Requirements)**: four requirement documents under `init/_work/stage-a-docs/`
- **Stage B (Blueprint)**: a machine-readable `init/_work/project-blueprint.json`
- **Stage C (Scaffold + Skills)**: a minimal scaffold + skill pack manifest update + wrapper sync via `node .ai/scripts/sync-skills.mjs`

The initialize-project-from-requirements skill is designed to be **bootstrap-only**. After initialization, you may remove the `init/` kit.

## When to use

Use the initialize-project-from-requirements skill when:

- The repo still contains an `init/` directory (bootstrap kit present).
- The user needs a clear, reviewable project description before implementation starts.
- You want deterministic initialization outputs (docs + blueprint + minimal scaffold + skills enabled).

Do NOT use the skill when:

- The repo has already been initialized and `init/_work/project-blueprint.json` is stable.
- The user is asking for implementation work unrelated to initialization.
- You do not have permission to generate or modify repo files.

## Inputs

- Repo root path (or run from repo root).
- Stage A docs root: `init/_work/stage-a-docs/` (created from templates in `templates/`)
- Stage B blueprint: `init/_work/project-blueprint.json`

Optional inputs:

- Provider set for wrapper sync: `both` (default), or `codex`, `claude`, `codex,claude`.

## Outputs

- Entry docs (human entry surface + generated routing):
  - `init/START-HERE.md` (intake doc; LLM-maintained blocks)
  - `init/INIT-BOARD.md` (LLM-owned; pipeline updates only the `MACHINE_SNAPSHOT` block)
- Stage A docs (created/updated by the authoring process):
  - `init/_work/stage-a-docs/requirements.md`
  - `init/_work/stage-a-docs/non-functional-requirements.md`
  - `init/_work/stage-a-docs/domain-glossary.md`
  - `init/_work/stage-a-docs/risk-open-questions.md`
- Stage B blueprint:
  - `init/_work/project-blueprint.json`
- Stage C scaffold (directories only; no framework code):
  - `src/` or (`apps/`, `packages/`) depending on `repo.layout`
- Skills enabled (SSOT):
  - `.ai/skills/_meta/sync-manifest.json` updated (based on `skills.packs`)
- Provider wrappers regenerated:
  - via `node .ai/scripts/sync-skills.mjs`

## Critical Process Rules (MUST follow)

### Rule 0: Entry Docs

- `init/START-HERE.md` is the **single intake surface** for progressive, user-friendly input capture and organization.
  - Only edit inside the `BEGIN LLM` / `END LLM` blocks.
- **Language gate:** entry docs are created only after `init/_work/.init-state.json` has `language` set (free-form string).
  - Ask the user to choose a working language, then run:
    - `node init/_tools/init.mjs start --repo-root .`
    - `node init/_tools/init.mjs set-language --language "<your language>" --repo-root .`
- `init/INIT-BOARD.md` is **LLM-owned**. The pipeline updates ONLY the machine snapshot block:
  - `<!-- INIT-BOARD:MACHINE_SNAPSHOT:START -->` ... `<!-- INIT-BOARD:MACHINE_SNAPSHOT:END -->`
  - Do NOT edit inside those markers.
- The machine snapshot is refreshed implicitly by every init pipeline command; use `update-board --apply` as the manual fallback.

### Rule 1: State Tracking

- Before starting, check for existing `init/_work/.init-state.json`
- If found, resume from recorded state (ask user to confirm)
- If not found, run `node init/_tools/init.mjs start` to create initial state
- **Validation fields** (`validated`) are automatically updated by `check-docs` and `validate` commands
- **Document existence fields** (`docsWritten`) are automatically updated when `check-docs` passes
- **Approval fields** (`userApproved`) and **stage transitions** are updated via `approve --stage <A|B|C>` command
- **Interview progress fields** (`stage-a.mustAsk.*`) are auto-marked complete when `check-docs` passes (Stage A validated).
- LLM MUST NOT hand-edit `init/_work/.init-state.json` (except via the `set-language` command updating `language`).
  - Use `init/START-HERE.md` LLM blocks for rolling notes and progress during the interview.
- State file will be deleted when `cleanup-init` is run

### Rule 2: Mandatory Checkpoints

- **EVERY stage transition requires explicit user approval**
- Use prompts from `templates/stage-checkpoints.md`
- Do NOT proceed without user saying "continue" / "approved" / "yes"

### Rule 3: Quality Self-Review

- Before requesting user approval, complete the relevant checklist in `templates/quality-checklist.md`
- If any checklist item is "No", iterate before proceeding

### Rule 4: Post-init LLM Doc Path Hygiene (required before cleanup-init)

- This gate is mandatory when the user chooses to remove the `init/` kit.
- Perform all steps before running `cleanup-init`:
  1. Scan active docs for init routes/paths (at minimum: `AGENTS.md`, `README.md`, and any active entry docs).
  2. Remove init-only routing/explanations from active docs (for example: `init/`, `init/AGENTS.md`, `init/README.md`, `init/_tools/...` as current workflow entry).
  3. Replace init workflow entry guidance with permanent project entry guidance (typically the root `AGENTS.md` and project root docs).
  4. Keep archived init history under `docs/project/overview/**` unchanged.
  5. Verify active docs no longer route to init with:

```bash
rg -n "init/" AGENTS.md README.md .ai/AGENTS.md dev-docs/AGENTS.md
```

- Only after this gate passes, run:

```bash
node init/_tools/init.mjs cleanup-init --repo-root . --apply --i-understand --archive
```

---

## Steps

### Stage A: interview -> requirement docs (verifiable)

1. **Initialize state**: Run `node init/_tools/init.mjs start` to create `init/_work/.init-state.json` and seed `init/_work/stage-a-docs/` + `init/_work/project-blueprint.json` templates.

2. **Set language (required before entry docs)**: Ask the user to choose a working language (free-form string), then run:

```bash
node init/_tools/init.mjs set-language --language "<your language>" --repo-root .
# Example:
# node init/_tools/init.mjs set-language --language "zh-CN" --repo-root .
```

This creates (copy-if-missing) `init/START-HERE.md` and `init/INIT-BOARD.md`.

3. **Domain terminology alignment** (MUST ask, but completion is optional):
   - Ask the user: "Before we collect requirements, would you like to align on domain terminology first?"
   - Explain: "If your project has specific domain terms, abbreviations, or concepts that need shared understanding, we can document them in `domain-glossary.md` upfront."
   - **If user chooses YES**:
     - Guide user to list key domain terms
     - Create/update `init/_work/stage-a-docs/domain-glossary.md` with provided terms
   - **If user chooses NO or LATER**:
     - Record the decision in `init/_work/stage-a-docs/domain-glossary.md` (for example: a short note `Status: deferred` or `No special terms yet`)
     - Continue to next step; if domain terms emerge during interview, prompt to add them to glossary
   - Asking the question is **mandatory**, but completing the glossary is **optional** - user may skip if terminology is straightforward

4. Use `templates/conversation-prompts.md` to run a structured requirements interview.
5. Confirm whether the heavy `agent-builder` workflow is needed; if not, plan to run Stage C with `--skip-agent-builder --i-understand`.
6. (Optional) If you want progress visibility while interviewing, update `init/_work/.init-state.json` `stage-a.mustAsk.*` incrementally.
   - Otherwise you can skip this: `check-docs` will auto-mark MUST-ask as complete when Stage A validates.
7. Draft the four Stage A documents using templates under `templates/`.
8. **Self-review**: Complete Stage A checklist in `templates/quality-checklist.md`.
9. Validate Stage A docs:

```bash
node init/_tools/init.mjs check-docs --docs-root init/_work/stage-a-docs
```

Use strict mode when you need a hard gate (CI / regulated workflows):

```bash
node init/_tools/init.mjs check-docs --docs-root init/_work/stage-a-docs --strict
```

10. **CHECKPOINT A->B**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
11. Wait for explicit user approval, then run:

```bash
node init/_tools/init.mjs approve --stage A
```

### Stage B: requirements -> blueprint (machine-readable)

1. Create `init/_work/project-blueprint.json` based on the Stage A docs.
2. Validate the blueprint:

```bash
node init/_tools/init.mjs validate   --blueprint init/_work/project-blueprint.json
```

3. Reconcile packs with capabilities (warn-only by default):

```bash
node init/_tools/init.mjs suggest-packs   --blueprint init/_work/project-blueprint.json   --repo-root .
```

If you want to **add missing recommended packs** into the blueprint (safe-add only):

```bash
node init/_tools/init.mjs suggest-packs   --blueprint init/_work/project-blueprint.json   --repo-root .   --write
```

4. **Self-review**: Complete Stage B checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT B->C**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
6. Wait for explicit user approval, then run:

```bash
node init/_tools/init.mjs approve --stage B
```

### Stage C: scaffold + enable packs + sync wrappers

1. Dry-run the scaffold plan:

```bash
node init/_tools/init.mjs scaffold   --blueprint init/_work/project-blueprint.json   --repo-root .
```

2. **Handle config template coverage**:
   - Check if the selected `repo.language` + `repo.packageManager` combination has a template in `templates/scaffold-configs/`.
   - **If a template exists**: The `apply` command will auto-generate base config files (e.g., `package.json`, `tsconfig.json`, `go.mod`).
   - **If no template exists**: You MUST provide guidance to the user:
     - Recommend essential config files based on the selected tech stack (e.g., for Python: `requirements.txt` or `pyproject.toml`, for Java: `pom.xml` or `build.gradle`).
     - Suggest using framework-specific CLI tools (e.g., `npm init`, `poetry init`, `dotnet new`) to generate starter configs.
     - Document the recommended config structure in `init/_work/stage-a-docs/non-functional-requirements.md` or create a brief setup guide.
     - Do NOT skip the guidance step; users need clear next steps even when templates are unavailable.

3. Apply scaffold + manifest update + wrapper sync:

```bash
node init/_tools/init.mjs apply   --blueprint init/_work/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

`--require-stage-a` fails only on Stage A doc **errors**. For strict gating (treat warnings as errors), use `--require-stage-a-strict`.

If the user opts out of `agent-builder`, add:

```bash
--skip-agent-builder --i-understand
```

4. **Self-review**: Complete Stage C checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT C Complete**: Use prompt from `templates/stage-checkpoints.md` to confirm completion. User will choose one of: "regen docs", "cleanup init", or "done".
6. **(Required) Review skill retention**: Confirm which skills to keep vs prune, then mark the review complete:

```bash
node init/_tools/init.mjs review-skill-retention --repo-root .
```

7. **(Recommended) Re-generate root docs**: If user replies "regen docs", (re)generate the root `README.md` + `AGENTS.md` from the blueprint:

```bash
node init/_tools/init.mjs update-root-docs --apply
```

8. If user chose "cleanup init", run the **Post-init LLM Doc Path Hygiene** gate (Rule 4) before cleanup. Do NOT use one-shot `apply --cleanup-init`.

9. (Optional) Remove the bootstrap kit if user chose "cleanup init" or explicitly requests later:

```bash
node init/_tools/init.mjs cleanup-init   --repo-root .   --apply   --i-understand --archive
```

10. **Approve Stage C**: After handling user's selected action(s) (`regen docs` and/or `cleanup init`), run:

```bash
node init/_tools/init.mjs approve --stage C
```

## Boundaries

- Do not invent requirements. Resolve ambiguity with the user, or record the item as TBD in `init/_work/stage-a-docs/risk-open-questions.md`.
- Do not add provider-specific assumptions into Stage A docs or the blueprint.
- Do not edit `.codex/skills/` or `.claude/skills/` directly. Only update SSOT in `.ai/skills/` and run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`. (The repo's SSOT rule applies.) 
- Scaffolding MUST NOT overwrite existing files; scaffolding should only create missing directories and small placeholder `README.md` files.
- **Exception**: The root `README.md` will be replaced with a project-specific version generated from the blueprint. The replacement is intentional - the template README should be replaced with project documentation.
- The root `AGENTS.md` will be updated from the blueprint (project type, tech stack, key directories) during Stage C apply.
- Do NOT use `node init/_tools/init.mjs apply --cleanup-init ...` for finalization. Always run cleanup as a separate step after Rule 4 (`Post-init LLM Doc Path Hygiene`) passes.
- During init-route cleanup, preserve archived history under `docs/project/overview/**`; only active docs should have init routing removed.

---

## Stage C: Skill Retention Review (required)

Before approving Stage C, you MUST review which skills to keep vs prune.

- Start from `templates/skill-retention-table.template.md` and fill the Skill + Description columns in-chat (translate to the user's preferred language if needed). Do NOT save `skill-retention-table.md` as a file.
- Ask the user to list skills to remove (name or path), then confirm before deleting.
- Use `node .ai/scripts/delete-skills.mjs --skills "<csv>" --dry-run`, then re-run with `--yes`.

## Root AGENTS.md update rules

Stage C `apply` (and `update-root-docs`) updates the root `AGENTS.md` from the blueprint. If manual edits are needed, follow these rules.

### MUST Preserve (template repo structure)

| Section | Reason |
|---------|--------|
| Key Directories table | Core navigation for LLM |
| Routing table | Task-type dispatch |
| Global Rules | Cross-cutting constraints |
| `.ai/` reference | SSOT skills location |
| `dev-docs/` reference | Complex task docs pattern |
| `## Need More?` | Navigation to detailed docs |
| Any other unlisted sections | Default: preserve unchanged |

**Modification boundary**: You are ONLY allowed to add/update: `## Project Type`, `## Tech Stack`, and entries in the `## Key Directories` table. All other content MUST remain unchanged.

### MUST Add/Update (project-specific info)

| Section | Source | Format |
|---------|--------|--------|
| Project Type | `project.name` + `project.description` | One-line summary |
| Tech Stack | `repo.language`, `repo.packageManager`, `repo.layout`, frameworks | Table |
| Key Directories | `repo.layout` + enabled capabilities | Update existing table |

**Note**: Do NOT create a separate `## Capabilities` section. Express capability info through Tech Stack rows (e.g., Frontend: React, Backend: Express, Database: PostgreSQL) and Key Directories entries (e.g., `apps/frontend/`, `apps/backend/`).

**Update logic**: If a section already exists (e.g., `## Project Type`), update its content. If the section does not exist, insert the section in the appropriate location. Do NOT create duplicate sections.

### Format Rules (LLM-friendly docs)

1. **Semantic density**: One key fact per line; avoid filler text
2. **Structured data**: Use tables for tech stack and directory mappings
3. **Token efficiency**: Prefer abbreviations in tables (e.g., "TS" for TypeScript)
4. **Scannable**: Keep sections short; use headers for navigation

### Example: Updated AGENTS.md structure

```markdown
# AI Assistant Instructions

## Project Type

{{project.name}} - {{project.description}}

## Tech Stack

| Category | Value |
|----------|-------|
| Language | {{repo.language}} |
| Package Manager | {{repo.packageManager}} |
| Layout | {{repo.layout}} |
| Frontend | {{capabilities.frontend.framework}} |
| Backend | {{capabilities.backend.framework}} |
| Database | {{capabilities.database.kind}} |

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `src/` or `apps/` | Application code |
| `apps/frontend/` | Frontend application (if enabled) |
| `apps/backend/` | Backend services (if enabled) |
| `.ai/` | Skills, scripts, LLM governance |
| `dev-docs/` | Working documentation |

## Routing

[preserve original routing table]

## Global Rules

[preserve original global rules]
```

## Included assets

### Templates

- `templates/conversation-prompts.md` - Question bank for Stage A interview
- `templates/START-HERE.template.md` - Template for the intake doc `init/START-HERE.md` (LLM blocks)
- `templates/INIT-BOARD.template.md` - Template for `init/INIT-BOARD.md` (LLM-owned; machine snapshot markers)
- `templates/requirements.template.md` - Stage A requirements doc template
- `templates/non-functional-requirements.template.md` - Stage A NFR doc template
- `templates/domain-glossary.template.md` - Stage A glossary template
- `templates/risk-open-questions.template.md` - Stage A risks template
- `templates/skill-retention-table.template.md` - Post-init skill retention table (NEW)
- `templates/project-blueprint.example.json` - Stage B blueprint example
- `templates/project-blueprint.schema.json` - Stage B blueprint JSON schema
- `templates/init-state.schema.json` - State tracking schema (NEW)
- `templates/init-state.example.json` - Initial state template (NEW)
- `templates/quality-checklist.md` - Semantic quality self-review (NEW)
- `templates/stage-checkpoints.md` - User approval prompts (NEW)
- `templates/scaffold-configs/` - Base config file templates (NEW)

### Scripts

- `scripts/init-pipeline.mjs` - Main pipeline script (start, status, approve, validate, check-docs, scaffold, apply, cleanup)
- `scripts/scaffold-configs.mjs` - Standalone config file generator (advanced usage, see note below)

**Note on config generation:**

| Entry Point | Use Case |
|-------------|----------|
| `apply` command (default) | Main workflow: scaffold + configs + manifest + wrapper sync in one step |
| `scaffold-configs.mjs` | Advanced: regenerate config files only, without running the full pipeline |

The `apply` command generates config files by default. Use `--skip-configs` to disable config generation. The standalone `scaffold-configs.mjs` is useful when you only need to update configs (e.g., after editing the blueprint) without re-running the entire scaffold process.

**Template coverage and fallback behavior:**

- Available templates are in `templates/scaffold-configs/` (currently: `typescript-pnpm/`, `go/`, `cpp-xmake/`, `react-native-typescript/`).
- When a template exists, config files are auto-generated during `apply`.
- When no template exists, you MUST provide user guidance:
  - Recommend essential config files based on the selected language/framework.
  - Suggest framework-specific CLI commands (e.g., `npm init`, `poetry init`).
  - Document recommendations in project docs or create a setup guide.
  - Do NOT leave users without clear next steps.
