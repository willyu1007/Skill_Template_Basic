---
name: initialize-project-from-requirements
description: Use only in repos that still include the `init/` bootstrap kit to produce Stage A/B/C artifacts, update skill pack selection, and sync provider skill wrappers.
---

# Initialize a Project From Requirements

## Purpose

Turn an early project idea into **verifiable, file-based** outputs:

- **Stage A (Requirements)**: four requirement documents under `init/stage-a-docs/`
- **Stage B (Blueprint)**: a machine-readable `init/project-blueprint.json`
- **Stage C (Scaffold + Skills)**: a minimal scaffold + skill pack manifest update + wrapper sync via `node .ai/scripts/sync-skills.mjs`

The initialize-project-from-requirements skill is designed to be **bootstrap-only**. After initialization, you may remove the `init/` kit.

## When to use

Use the initialize-project-from-requirements skill when:

- The repo still contains an `init/` directory (bootstrap kit present).
- The user needs a clear, reviewable project description before implementation starts.
- You want deterministic initialization outputs (docs + blueprint + minimal scaffold + skills enabled).

Do NOT use the skill when:

- The repo has already been initialized and `init/project-blueprint.json` is stable.
- The user is asking for implementation work unrelated to initialization.
- You do not have permission to generate or modify repo files.

## Inputs

- Repo root path (or run from repo root).
- Stage A docs root: `init/stage-a-docs/` (created from templates in `templates/`)
- Stage B blueprint: `init/project-blueprint.json`

Optional inputs:

- Provider set for wrapper sync: `both` (default), or `codex`, `claude`, `codex,claude`.

## Outputs

- Stage A docs (created/updated by the authoring process):
  - `init/stage-a-docs/requirements.md`
  - `init/stage-a-docs/non-functional-requirements.md`
  - `init/stage-a-docs/domain-glossary.md`
  - `init/stage-a-docs/risk-open-questions.md`
- Stage B blueprint:
  - `init/project-blueprint.json`
- Stage C scaffold (directories only; no framework code):
  - `src/` or (`apps/`, `packages/`) depending on `repo.layout`
- Skills enabled (SSOT):
  - `.ai/skills/_meta/sync-manifest.json` updated (based on `skills.packs`)
- Provider wrappers regenerated:
  - via `node .ai/scripts/sync-skills.mjs`

## Critical Process Rules (MUST follow)

### Rule 1: State Tracking

- Before starting, check for existing `init/.init-state.json`
- If found, resume from recorded state (ask user to confirm)
- If not found, run `node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs start` to create initial state
- **Validation fields** (`validated`) are automatically updated by `check-docs` and `validate` commands
- **Document existence fields** (`docsWritten`) are automatically updated when `check-docs` passes
- **Approval fields** (`userApproved`) and **stage transitions** are updated via `approve --stage <A|B|C>` command
- **Interview progress fields** (`stage-a.mustAsk.*`) are not inferred automatically; update `init/.init-state.json` manually if you want `status` to reflect interview progress
- State file will be deleted when `cleanup-init` is run

### Rule 2: Mandatory Checkpoints

- **EVERY stage transition requires explicit user approval**
- Use prompts from `templates/stage-checkpoints.md`
- Do NOT proceed without user saying "continue" / "approved" / "yes"

### Rule 3: Quality Self-Review

- Before requesting user approval, complete the relevant checklist in `templates/quality-checklist.md`
- If any checklist item is "No", iterate before proceeding

---

## Steps

### Stage A: interview → requirement docs (verifiable)

1. **Initialize state**: Run `node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs start` to create `init/.init-state.json` and seed `init/stage-a-docs/` + `init/project-blueprint.json` templates.

2. **Domain terminology alignment** (MUST ask, but completion is optional):
   - Ask the user: "Before we collect requirements, would you like to align on domain terminology first?"
   - Explain: "If your project has specific domain terms, abbreviations, or concepts that need shared understanding, we can document them in `domain-glossary.md` upfront."
   - **If user chooses YES**:
     - Guide user to list key domain terms
     - Create/update `init/stage-a-docs/domain-glossary.md` with provided terms
   - **If user chooses NO or LATER**:
     - Record the decision in `init/stage-a-docs/domain-glossary.md` (for example: a short note `Status: deferred` or `No special terms yet`)
     - Continue to next step; if domain terms emerge during interview, prompt to add them to glossary
   - Asking the question is **mandatory**, but completing the glossary is **optional** — user may skip if terminology is straightforward

3. Use `templates/conversation-prompts.md` to run a structured requirements interview.
4. Confirm whether the heavy `agent-builder` workflow is needed; if not, plan to run Stage C with `--skip-agent-builder --i-understand`.
5. (Optional) Update `init/.init-state.json` `stage-a.mustAsk.*` as each MUST-ask question is asked/answered, so `status` reflects interview progress.
6. Draft the four Stage A documents using templates under `templates/`.
7. **Self-review**: Complete Stage A checklist in `templates/quality-checklist.md`.
8. Validate Stage A docs:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --docs-root init/stage-a-docs
```

Use strict mode when you need a hard gate (CI / regulated workflows):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --docs-root init/stage-a-docs --strict
```

9. **CHECKPOINT A→B**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
10. Wait for explicit user approval, then run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage A
```

### Stage B: requirements → blueprint (machine-readable)

1. Create `init/project-blueprint.json` based on the Stage A docs.
2. Validate the blueprint:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate   --blueprint init/project-blueprint.json
```

3. Reconcile packs with capabilities (warn-only by default):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs   --blueprint init/project-blueprint.json   --repo-root .
```

If you want to **add missing recommended packs** into the blueprint (safe-add only):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs   --blueprint init/project-blueprint.json   --repo-root .   --write
```

4. **Self-review**: Complete Stage B checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT B→C**: Use prompt from `templates/stage-checkpoints.md` to request user approval.
6. Wait for explicit user approval, then run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage B
```

### Stage C: scaffold + enable packs + sync wrappers

1. Dry-run the scaffold plan:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs scaffold   --blueprint init/project-blueprint.json   --repo-root .
```

2. **Handle config template coverage**:
   - Check if the selected `repo.language` + `repo.packageManager` combination has a template in `templates/scaffold-configs/`.
   - **If a template exists**: The `apply` command will auto-generate base config files (e.g., `package.json`, `tsconfig.json`, `go.mod`).
   - **If no template exists**: You MUST provide guidance to the user:
     - Recommend essential config files based on the selected tech stack (e.g., for Python: `requirements.txt` or `pyproject.toml`, for Java: `pom.xml` or `build.gradle`).
     - Suggest using framework-specific CLI tools (e.g., `npm init`, `poetry init`, `dotnet new`) to generate starter configs.
     - Document the recommended config structure in `init/stage-a-docs/non-functional-requirements.md` or create a brief setup guide.
     - Do NOT skip the guidance step; users need clear next steps even when templates are unavailable.

3. Apply scaffold + manifest update + wrapper sync:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply   --blueprint init/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

If the user opts out of `agent-builder`, add:

```bash
--skip-agent-builder --i-understand
```

4. **Self-review**: Complete Stage C checklist in `templates/quality-checklist.md`.
5. **CHECKPOINT C Complete**: Use prompt from `templates/stage-checkpoints.md` to confirm completion. User will choose one of: "update agents", "cleanup init", or "done".
6. **(Recommended) Update root AGENTS.md**: If user replies "update agents", update the root `AGENTS.md` with project-specific info **before** running approve. See **Post-init: Update AGENTS.md** section below for rules.
7. **Approve Stage C**: After handling user's choice (update agents if selected), run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs approve --stage C
```

8. (Optional) Remove the bootstrap kit if user chose "cleanup init" or explicitly requests later:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init   --repo-root .   --apply   --i-understand --archive
```

## Boundaries

- Do not invent requirements. Resolve ambiguity with the user, or record the item as TBD in `init/stage-a-docs/risk-open-questions.md`.
- Do not add provider-specific assumptions into Stage A docs or the blueprint.
- Do not edit `.codex/skills/` or `.claude/skills/` directly. Only update SSOT in `.ai/skills/` and run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`. (The repo's SSOT rule applies.) 
- Scaffolding MUST NOT overwrite existing files; scaffolding should only create missing directories and small placeholder `README.md` files.
- **Exception**: The root `README.md` will be replaced with a project-specific version generated from the blueprint. The replacement is intentional — the template README should be replaced with project documentation.

---

## Post-init: Skill Retention and Pruning (optional)

After Stage C, you MAY prune unneeded skills using a retention table.

- Start from `templates/skill-retention-table.template.md` and fill the Skill + Description columns in-chat (translate to the user's preferred language if needed). Do NOT save `skill-retention-table.md` as a file.
- Ask the user to list skills to remove (name or path), then confirm before deleting.
- Use `node .ai/scripts/delete-skills.mjs --skills "<csv>" --dry-run`, then re-run with `--yes`.

## Post-init: Update AGENTS.md

After Stage C completion, if the user chooses to update the root `AGENTS.md`, follow these rules.

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

### Examples

- `examples/quickstart.md` - Quick start guide
- `examples/blueprint-review.md` - Blueprint review walkthrough
