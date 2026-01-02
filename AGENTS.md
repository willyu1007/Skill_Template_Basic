# AI Assistant Instructions

This is an **AI-Friendly Repository Template** - a starter kit for creating LLM-optimized codebases.

## First Time?

**Read `init/AGENTS.md` for initialization instructions.**

## Project Type

Template repository. Users clone this to start new AI-friendly projects.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `init/` | **Start here** - Initialization instructions and output |
| `.ai/skills/` | Single Source of Truth for skills (including workflows) |
| `.ai/scripts/` | Sync scripts (Node.js) |
| `.ai/llm/` | LLM engineering governance entry (see `.ai/llm/AGENTS.md`) |
| `.codex/` | Codex skill entry stubs |
| `.claude/` | Claude skill entry stubs |
| `dev/` | Working documentation for complex tasks |

## Common Tasks

### Add New Skill

1. Create `.ai/skills/[skill-name]/SKILL.md`
2. Add supporting files alongside `SKILL.md` (for example `reference.md`, `examples.md`, `scripts/`, `templates/`)
3. Run `node .ai/scripts/sync-skills.cjs`

### Add New Workflow (as a skill)

1. Create `.ai/skills/[workflow-name]/SKILL.md`
2. Include YAML frontmatter with `name` and `description`
3. Run `node .ai/scripts/sync-skills.cjs`

## Available Workflows

| Workflow | Description |
|----------|-------------|
| `debug-authenticated-routes` | Diagnose 401/403 errors and JWT issues |
| `test-authenticated-routes` | End-to-end API route verification |
| `map-route-changes-for-testing` | Map route changes for testing |
| `fix-frontend-runtime-errors` | Debug React components and styling |
| `resolve-typescript-build-errors` | Fix `tsc` compilation errors |
| `review-code-architecture` | Review code for pattern consistency |
| `execute-code-refactor` | Safely reorganize code |
| `plan-code-refactors` | Plan refactoring tasks |
| `review-implementation-plans` | Review implementation plans |
| `author-developer-documentation` | Keep documentation accurate |
| `create-dev-docs-plan` | Create development docs plan |
| `update-dev-docs-for-handoff` | Update docs for session handoff |
| `perform-web-research` | Deep-dive into complex problems |
| `generate-skills-from-knowledge` | Generate skills from knowledge |
| `land-skills-into-repo` | Install skills bundle into repo |

Workflow skills live under `.ai/skills/workflows/`

## Rules

- Always edit `.ai/skills/` (SSOT), never edit `.codex/` or `.claude/` directly
- For LLM engineering tasks, open `.ai/llm/AGENTS.md`
- Use supporting files (`reference.md`, `examples.md`, `scripts/`, `templates/`) for detailed reference content
- Do not create a `resources/` subdirectory inside skills
- Follow progressive disclosure pattern
