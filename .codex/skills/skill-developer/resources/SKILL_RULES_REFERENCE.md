# Skill SSOT Reference

Documentation on the standard structure and metadata for skills within the AI-friendly repository template.

---

## Skill Directory Structure

Every skill is a self-contained directory under `.ai/ssot/skills/`:

```
<skill-name>/
├── SKILL.md                  # Required: Main instructions + Frontmatter
└── resources/                # Optional: Supporting documentation
    └── <topic>.md
```

## SKILL.md Frontmatter Specification

The `SKILL.md` file MUST start with a YAML frontmatter block containing the following fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique identifier for the skill (kebab-case). |
| `description` | string | Yes | High-level summary of the skill's purpose and trigger keywords. Max 1024 characters. |

**Example:**
```yaml
---
name: backend-guidelines
description: |
  Patterns and best practices for Node.js, Express, and Prisma. 
  Triggers on API creation, route handling, and database migrations.
---
```

## Content Organization Rules

1. **The 500-Line Rule**: The `SKILL.md` file should be concise (ideally under 500 lines). Extensive details should be moved to the `resources/` directory.
2. **Progressive Disclosure**: Use the main file for navigation and critical paths. Use resource files for specialized topics.
3. **SSOT Principle**: The contents in `.ai/ssot/` are the only source of truth. Provider-specific artifacts (like `.codex/skills/` or `.claude/skills/`) are generated from here.

## Naming Conventions

- **Skill Name**: Use kebab-case (e.g., `skill-developer`, `route-tester`).
- **Resource Files**: Use kebab-case or snake_case, but stay consistent within the skill.
- **Triggers**: Use clear, unambiguous keywords that represent the domain or action.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Detailed trigger documentation
- [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md) - Pattern library

