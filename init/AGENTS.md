# Initialization Instructions (LLM)

You are initializing a new project using the repository template.

## Conclusions (read first)

- You MUST follow a **3-stage, file-based** pipeline:
  - **Stage A**: write requirement docs under `init/stage-a-docs/` (DoD-driven).
  - **Stage B**: write a machine-readable blueprint at `init/project-blueprint.json`.
  - **Stage C**: scaffold minimal structure + select skill packs by updating `.ai/skills/_meta/sync-manifest.json`, then run `node .ai/scripts/sync-skills.cjs --scope current --providers both --mode reset --yes`.
- You MUST keep changes **verifiable**:
  - Each stage ends with a checklist and a command that verifies outputs.
- You MUST NOT edit generated wrapper stubs directly:
  - Do not edit `.codex/skills/` or `.claude/skills/` by hand.
  - Only edit SSOT in `.ai/skills/`, then run `node .ai/scripts/sync-skills.cjs --scope current --providers both --mode reset --yes`.

## Inputs you MUST collect from the user

Use `init/skills/initialize-project-from-requirements/templates/conversation-prompts.md` as your question bank.

Minimum required inputs:

- one-line project purpose
- primary user roles
- in-scope MUST requirements and out-of-scope (OUT)
- top user journeys with acceptance criteria
- constraints (compliance/security/platform/deadlines/integrations)
- tech stack (programming language, package manager, frontend/backend frameworks)
- repo layout intent (`single` vs `monorepo`)
- quality expectations (testing/CI/devops)
- whether to keep the heavy `agent_builder` workflow skill (if not needed, prune it after init)

If the user cannot decide, you MUST record TBD items in `init/stage-a-docs/risk-open-questions.md` (owner + options + decision due).

## Stage A - Requirements (write files)

### Outputs

Create/update these files under `init/stage-a-docs/`:

- `requirements.md`
- `non-functional-requirements.md`
- `domain-glossary.md`
- `risk-open-questions.md`

Start from templates under:
- `init/skills/initialize-project-from-requirements/templates/`

The `start` command automatically creates template files at `init/stage-a-docs/` and `init/project-blueprint.json` (if not present).

### Verification (required)

Run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs check-docs --docs-root init/stage-a-docs
```

If the repo uses a strict gate, run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs check-docs --docs-root init/stage-a-docs --strict
```

Iterate with the user until Stage A passes.

## Stage B - Blueprint (write file)

### Output

- `init/project-blueprint.json`

Start from:
- `init/skills/initialize-project-from-requirements/templates/project-blueprint.example.json`

### Verification (required)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs validate   --blueprint init/project-blueprint.json
```

### Pack suggestions (recommended)

Run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs suggest-packs   --blueprint init/project-blueprint.json   --repo-root .
```

- If recommended packs are missing, you SHOULD discuss with the user before changing `skills.packs`.
- Only use `--write` if the user approves adding recommended packs.

## Stage C - Scaffold + Skills (run commands)

### Dry-run scaffold first (required)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs scaffold   --blueprint init/project-blueprint.json   --repo-root .
```

### Apply (writes changes + sync wrappers)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs apply   --blueprint init/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

The apply command will:
- create missing scaffold directories (no overwrites),
- update `.ai/skills/_meta/sync-manifest.json` (based on `skills.packs`),
- run `node .ai/scripts/sync-skills.cjs --scope current --providers both --mode reset --yes` to regenerate wrappers.

If the user opts out of `agent_builder`, add:

```bash
--skip-agent-builder --i-understand
```

### Optional: prune agent builder after init

If the user decides to remove `agent_builder` after initialization is complete, run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs prune-agent-builder   --repo-root .   --apply   --i-understand
```

The prune-agent-builder command will remove `.ai/skills/workflows/agent` and re-sync wrappers.

### Optional: remove init kit after success

Only if the user asks to remove bootstrap artifacts (optionally archive to `docs/project/` first):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.cjs cleanup-init   --repo-root .   --apply   --i-understand --archive
```

## Prompt template (use internally)

Goal:
- Initialize the project with verifiable 3-stage outputs.

Constraints (MUST / DON'T):
- MUST output Stage A docs under `init/stage-a-docs/` during initialization.
- MUST output blueprint at `init/project-blueprint.json` during initialization.
- MUST update skills via `.ai/skills/_meta/sync-manifest.json` and run `node .ai/scripts/sync-skills.cjs --scope current --providers both --mode reset --yes`.
- DON'T edit `.codex/skills/` or `.claude/skills/` directly.

Acceptance criteria:
- Stage A passes `check-docs` (strict if required).
- Stage B blueprint validates.
- Stage C wrappers regenerated and match selected packs.

---

## Post-init: Update Root AGENTS.md

After Stage C completes, ask the user if they want to update the root `AGENTS.md` with project-specific info.

### When to ask

At Stage C completion checkpoint, present option: "update agents" to record tech stack in root AGENTS.md.

### What to preserve

The root `AGENTS.md` contains template repo structure that MUST be kept:

| Section | Keep? | Reason |
|---------|-------|--------|
| Key Directories table | YES | LLM navigation |
| Routing table | YES | Task dispatch |
| Global Rules | YES | Cross-cutting constraints |
| `.ai/` reference | YES | SSOT location |
| `dev-docs/` reference | YES | Complex task pattern |

### What to add

From `init/project-blueprint.json`:

| Add | Source field | Example |
|-----|--------------|---------|
| Project Type | `project.name`, `project.description` | "my-app - E-commerce platform" |
| Tech Stack table | `repo.language`, `repo.packageManager`, `repo.layout`, frameworks | TypeScript, pnpm, monorepo, React, Express |
| Project directories | derived from `repo.layout` + enabled capabilities | `apps/frontend/`, `apps/backend/`, `src/` |

**Note**: Do NOT create a separate `## Capabilities` section. Express capability info through Tech Stack rows (e.g., Frontend: React, Backend: Express, Database: PostgreSQL) and Key Directories entries.

### How to update

1. Read current root `AGENTS.md`
2. Update existing `## Project Type` section if present; otherwise insert after title
3. Update existing `## Tech Stack` section if present; otherwise insert after Project Type
4. Update "Key Directories" table with project paths (add project-specific entries)
5. Preserve all other sections unchanged (including `## Need More?`, routing, global rules, etc.)
6. Show diff to user before writing

### Format rules

- One fact per line (semantic density)
- Use tables for structured data (tech stack, directories)
- Prefer short terms in tables ("TS" over "TypeScript" is acceptable)
- No redundant prose; headers provide context
