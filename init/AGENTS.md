# Initialization Instructions (LLM)

You are initializing a new project using the repository template.

## Conclusions (read first)

- You MUST follow a **3-stage, file-based** pipeline:
  - **Stage A**: write requirement docs under `init/stage-a-docs/` (DoD-driven).
  - **Stage B**: write a machine-readable blueprint at `init/project-blueprint.json`.
  - **Stage C**: scaffold minimal structure + select skill packs by updating `.ai/skills/_meta/sync-manifest.json`, then run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`.
- You MUST keep changes **verifiable**:
  - Each stage ends with a checklist and a command that verifies outputs.
- You MUST NOT create dev-docs task bundles during initialization:
  - Use the 3-stage init pipeline only; dev-docs workflows apply after init is complete.
- You MUST NOT edit generated wrapper stubs directly:
  - Do not edit `.codex/skills/` or `.claude/skills/` by hand.
  - Only edit SSOT in `.ai/skills/`, then run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`.

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
- whether to keep the heavy `agent-builder` workflow skill (if not needed, prune it after init)
- post-init skill retention preferences (if known; otherwise decide after Stage C)

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
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --docs-root init/stage-a-docs
```

If the repo uses a strict gate, run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs check-docs --docs-root init/stage-a-docs --strict
```

Iterate with the user until Stage A passes.

## Stage B - Blueprint (write file)

### Output

- `init/project-blueprint.json`

Start from:
- `init/skills/initialize-project-from-requirements/templates/project-blueprint.example.json`

### Verification (required)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs validate   --blueprint init/project-blueprint.json
```

### Pack suggestions (recommended)

Run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs suggest-packs   --blueprint init/project-blueprint.json   --repo-root .
```

- If recommended packs are missing, you SHOULD discuss with the user before changing `skills.packs`.
- Only use `--write` if the user approves adding recommended packs.

## Stage C - Scaffold + Skills (run commands)

### Dry-run scaffold first (required)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs scaffold   --blueprint init/project-blueprint.json   --repo-root .
```

### Apply (writes changes + sync wrappers)

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs apply   --blueprint init/project-blueprint.json   --repo-root .   --providers codex,claude   --require-stage-a
```

The apply command will:
- create missing scaffold directories (no overwrites),
- update `.ai/skills/_meta/sync-manifest.json` (based on `skills.packs`),
- run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes` to regenerate wrappers.

If the user opts out of `agent-builder`, add:

```bash
--skip-agent-builder --i-understand
```

### Troubleshooting: EPERM writing `.codex/skills`

If Stage C `apply` fails with `EPERM` for `.codex/skills/`:
- Cause: sandboxed filesystem denies writes to `.codex/skills/` during stub regeneration.
- Fix: rerun the same `apply` command with escalated filesystem permissions (no blueprint changes).
- DON'T: do NOT modify the blueprint to work around permission errors.

### Optional: prune agent builder after init

If the user decides to remove `agent-builder` after initialization is complete, run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs prune-agent-builder   --repo-root .   --apply   --i-understand
```

The prune-agent-builder command will remove `.ai/skills/workflows/agent` and re-sync wrappers.

If you plan to prune multiple skills post-init, you MAY delete `agent-builder` via the post-init skill pruning step instead of running this command.

### Optional: remove init kit after success

Only if the user asks to remove bootstrap artifacts (optionally archive to `docs/project/overview/` first; override with `--archive-dir` if needed):

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init   --repo-root .   --apply   --i-understand --archive
```

## Prompt template (use internally)

Goal:
- Initialize the project with verifiable 3-stage outputs.

Constraints (MUST / DON'T):
- MUST output Stage A docs under `init/stage-a-docs/` during initialization.
- MUST output blueprint at `init/project-blueprint.json` during initialization.
- MUST update skills via `.ai/skills/_meta/sync-manifest.json` and run `node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes`.
- DON'T edit `.codex/skills/` or `.claude/skills/` directly.
- DON'T create dev-docs task bundles during initialization (use dev-docs only after init is complete).

Acceptance criteria:
- Stage A passes `check-docs` (strict if required).
- Stage B blueprint validates.
- Stage C wrappers regenerated and match selected packs.

---

## Stage C: Skill Retention Review (required)

Skill retention/pruning is reviewed in **Stage C**, after wrappers are generated.

`approve --stage C` will refuse until the review is marked complete.

### When to ask

After Stage C `apply` completes, before approving Stage C.

### Retention table (recommended)

Generate a structured, readable table of all current skills from `.ai/skills/`. Start from `init/skills/initialize-project-from-requirements/templates/skill-retention-table.template.md`, and use separate tables for `workflows/` and `standards/` to keep it scannable. Keep the table in-chat only; do NOT save `skill-retention-table.md` as a file.

Table columns:

| Skill | Description |
|-------|-------------|

Rules:
- Translate descriptions to the user's preferred language if needed.
- Remind the user they can list skills to delete directly based on the table.

### Apply changes (after confirmation)

1. Ask the user to list the skills to remove (by name or path).
2. Dry run the deletion:

```bash
node .ai/scripts/delete-skills.mjs --skills "skill-a,skill-b" --dry-run
```

3. Confirm with the user, then re-run with `--yes` (optionally `--clean-empty`).
4. Expected result: the script reports deletions under `.ai/skills/`, `.codex/skills/`, and `.claude/skills/`.

### Mark review complete (required)

After the user confirms skill retention (whether they prune or keep everything), run:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs review-skill-retention --repo-root .
```

### If the user cannot decide

Record TBD items in `init/stage-a-docs/risk-open-questions.md` (owner + options + decision due).

### Notes

- `delete-skills.mjs` is an alias of `delete-skill.mjs` and accepts the same flags (`--skill`, `--skills`, `--scope`).
- Deletions are destructive; use `--dry-run` first and keep a git rollback plan.
- Re-running is safe: already-removed skills are skipped.

## Stage C: Root README.md

Stage C `apply` generates a project-specific root `README.md` from the blueprint (template: `init/skills/initialize-project-from-requirements/templates/README.template.md`).

### When to ask

At the Stage C completion checkpoint (review and iterate if needed).

### What to preserve

The root `README.md` contains template navigation that SHOULD be kept:

| Section | Keep? | Reason |
|---------|-------|--------|
| Quick Start table | YES | Onboarding entry points |
| Skill Entry Points | YES | SSOT location + sync command |
| Documentation links | YES | LLM/human navigation |

### What to add or update

From `init/project-blueprint.json` and the scaffolded layout:

| Add/Update | Source | Example |
|------------|--------|---------|
| Title + description | `project.name`, `project.description` | "my-app - E-commerce platform" |
| Tech Stack table | `repo.language`, `repo.packageManager`, frameworks | TS, pnpm, React, Express |
| Repo layout tree | scaffolded directories | `apps/`, `packages/`, `src/` |

### How to update

To regenerate deterministically from blueprint:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs update-root-docs --apply --skip-root-agents
```

### Format and safety

- Use tables for stack and quick start.
- Wrap paths/commands in backticks.
- Blast radius: `README.md` only.
- Idempotency: re-running is safe if you review the diff.

## Stage C: Root AGENTS.md

Stage C `apply` updates the root `AGENTS.md` from the blueprint (unless `--skip-root-agents` is used).

### When to ask

At Stage C completion checkpoint (review and iterate if needed).

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

To regenerate deterministically from blueprint:

```bash
node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs update-root-docs --apply --skip-readme
```

### Format rules

- One fact per line (semantic density)
- Use tables for structured data (tech stack, directories)
- Prefer short terms in tables ("TS" over "TypeScript" is acceptable)
- No redundant prose; headers provide context
