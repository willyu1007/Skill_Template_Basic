# {{PROJECT_NAME}}

{{PROJECT_DESCRIPTION}}

{{#DOMAIN}}
**Domain:** {{DOMAIN}}
{{/DOMAIN}}

## Quick Start

| For | Action |
|-----|--------|
| **AI Assistants** | Read `AGENTS.md` -> Follow routing |
| **Humans** | Read `docs/project/overview/` -> Project overview |

## Tech Stack

| Category | Value |
|----------|-------|
| Language | {{LANGUAGE}} |
| Package Manager | {{PACKAGE_MANAGER}} |
| Layout | {{REPO_LAYOUT}} |
{{#FRONTEND_FRAMEWORK}}| Frontend | {{FRONTEND_FRAMEWORK}} |
{{/FRONTEND_FRAMEWORK}}
{{#BACKEND_FRAMEWORK}}| Backend | {{BACKEND_FRAMEWORK}} |
{{/BACKEND_FRAMEWORK}}
{{#DATABASE_KIND}}| Database | {{DATABASE_KIND}} |
{{/DATABASE_KIND}}
{{#API_STYLE}}| API | {{API_STYLE}} |
{{/API_STYLE}}

## Getting Started

### Prerequisites

{{#IS_NODE}}
- Node.js (LTS recommended)
- {{PACKAGE_MANAGER}}
{{/IS_NODE}}
{{#IS_PYTHON}}
- Python 3.8+
- {{PACKAGE_MANAGER}}
{{/IS_PYTHON}}
{{#IS_GO}}
- Go 1.21+
{{/IS_GO}}

### Installation

```bash
{{INSTALL_COMMAND}}
```

### Development

```bash
{{DEV_COMMAND}}
```

### Tests

```bash
{{TEST_COMMAND}}
```

## What's Inside

```
{{PROJECT_STRUCTURE}}
```

{{#HAS_INIT_KIT}}
## Initialization (Bootstrap Kit)

- Human guide: `init/README.md`
- LLM instructions: `init/AGENTS.md`
- Optional cleanup (after archiving): `node init/skills/initialize-project-from-requirements/scripts/init-pipeline.mjs cleanup-init --apply --i-understand --archive`
{{/HAS_INIT_KIT}}

## Skill Entry Points

- **SSOT Skills**: `.ai/skills/` — Edit skills here only
- **Generated Wrappers**: `.codex/skills/`, `.claude/skills/` — Do NOT edit directly

Regenerate wrappers after skill changes:

```bash
node .ai/scripts/sync-skills.mjs --scope current --providers both --mode reset --yes
```

## Documentation

- Project overview + archived init SSOT (optional): `docs/project/overview/`
- Dev docs pattern: `dev-docs/README.md`
