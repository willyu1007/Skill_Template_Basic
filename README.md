# AI-Friendly Repository Template

A starter kit for creating LLM-optimized codebases with Single Source of Truth (SSOT) architecture.

## Quick Start

| For | Action |
|-----|--------|
| **AI Assistants** | Read `init/AGENTS.md` -> Initialize project |
| **Humans** | Read `init/README.md` -> Follow quick start |

## What's Inside

```
init/                      # START HERE
|-- README.md              # Template overview & quick start
|-- AGENTS.md              # AI initialization instructions
`-- INITIALIZATION.md      # Detailed field reference

.ai/skills/                # SSOT for skills (incl. workflows)
.ai/scripts/               # Sync scripts
.ai/llm/                   # LLM governance entry + registries (providers/profiles/prompts/config)

dev/                       # Development documentation
|-- README.md              # Dev Docs Pattern guide
|-- active/                # Current tasks
`-- archive/               # Completed tasks

.codex/skills/             # Codex skill entry stubs
.claude/skills/            # Claude skill entry stubs
```

## Skill Entry Points

- Canonical skills live in `.ai/skills/`
- `.codex/skills/` and `.claude/skills/` contain stubs that point back to SSOT
- Refresh stubs with `node .ai/scripts/sync-skills.cjs --scope current --providers both`

## Documentation

- [Initialization Guide](init/README.md)
- [Dev Docs Pattern](dev/README.md)
- [Documentation Guidelines](.ai/skills/standards/documentation-guidelines/SKILL.md)
- [Naming Conventions](.ai/skills/standards/naming-conventions/SKILL.md)




