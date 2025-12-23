# AI-Friendly Repository Template

A starter kit for creating LLM-optimized codebases with Single Source of Truth (SSOT) architecture.

## What This Template Provides

| Component | Location | Description |
|-----------|----------|-------------|
| Skills | `.ai/skills/` | Coding patterns, guidelines, and workflow skills |
| Commands | `.ai/commands/` | Reusable task templates |
| Scripts | `.ai/scripts/` | Stub sync scripts |

## Quick Start

### Option 1: AI-Assisted (Recommended)

1. Open project with your AI assistant
2. AI reads `init/AGENTS.md` and guides initialization
3. Follow prompts to provide project information
4. AI generates profile and syncs skill stubs

### Option 2: Manual

```bash
# 1. Sync skill stubs
node .ai/scripts/sync-skills.js

# 2. Create project profile manually
# See init/INITIALIZATION.md
```

## Directory Structure

```
.ai/
|-- skills/               # SSOT for skills (incl. workflows)
|-- commands/             # SSOT for commands
|-- scripts/              # Node.js sync scripts
`-- templates/            # Templates and examples

init/                     # Initialization (you are here)
|-- README.md             # This file
|-- AGENTS.md             # AI assistant instructions
|-- INITIALIZATION.md     # Detailed initialization workflow
`-- project-profile.*     # Generated after initialization

dev/                      # Development documentation
|-- README.md             # Dev Docs Pattern guide
|-- active/               # Current tasks
`-- archive/              # Completed tasks

.codex/skills/            # Codex skill entry stubs
.claude/skills/           # Claude skill entry stubs
```

## After Initialization

1. **Customize Skills**: Edit `.ai/skills/` for your project
2. **Add Workflow Skills**: Create workflow skills under `.ai/skills/`
3. **Add Commands**: Create or update `.ai/commands/`
4. **Re-sync Stubs**: `node .ai/scripts/sync-skills.js`

## Documentation

- [Dev Docs Pattern](../dev/README.md) - Context persistence across sessions
- [Documentation Guidelines](../docs/documentation-guidelines.md)
- [Naming Conventions](../docs/naming-conventions.md)


