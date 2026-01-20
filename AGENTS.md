# AI Assistant Instructions

**AI-Friendly Repository Template** - a starter kit for creating LLM-optimized codebases.

## Project Type

Template repository. Users clone the repo to start new AI-friendly projects.

## Key Directories

| Directory | Purpose |
|-----------|---------|
| `init/` | **Start here** - Initialization instructions |
| `.ai/` | Skills, scripts, LLM governance (see `.ai/AGENTS.md`) |
| `dev-docs/` | Working documentation for complex tasks |

## Routing

| Task Type | Entry Point |
|-----------|-------------|
| **First time / Project setup** | `init/AGENTS.md` |
| **Skill authoring / maintenance** | `.ai/AGENTS.md` |
| **LLM engineering** | `.ai/llm-config/AGENTS.md` |
| **Complex task documentation** | `dev-docs/AGENTS.md` |

## Global Rules

- For complex tasks (multi-module, multi-session, >2 hours), create task docs under `dev-docs/active/`
- Always edit `.ai/skills/` (SSOT), never edit `.codex/` or `.claude/` directly
- Follow progressive disclosure: read only the file you are routed to
- On context reset for ongoing work, read `dev-docs/active/<task-slug>/00-overview.md` first

## Coding Standards (MUST)

- **ESM (.mjs)**: All scripts in the repo use ES Modules with `.mjs` extension. Use `import`/`export` syntax, not `require()`.

## Coding Workflow (MUST)

- Before modifying code/config for a non-trivial task, apply the Decision Gate in `dev-docs/AGENTS.md` and create/update the dev-docs task bundle as required.
- If the user asks for planning artifacts (plan/roadmap/milestones/implementation plan) before coding, use `plan-maker` first, then ask for confirmation to proceed with implementation.
- If the task needs context preservation (multi-session, handoff) or qualifies as complex, follow `dev-docs/AGENTS.md` and use dev-docs workflows (`create-dev-docs-plan`, `update-dev-docs-for-handoff`).
