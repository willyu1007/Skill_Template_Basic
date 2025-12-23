# Skill Directory Structure (Claude-aligned)

This template follows Claude Code's "Add supporting files" guidance:
- `SKILL.md` is required.
- Supporting files live alongside `SKILL.md`.
- Optional subdirectories: `scripts/`, `templates/`.
- Do not use a `resources/` subdirectory.

Recommended layout (Claude example):

```
<skill-name>/
  SKILL.md
  reference.md
  examples.md
  scripts/
    helper.py
  templates/
    template.txt
```

Notes:
- `reference.md` and `examples.md` are optional; delete if unused.
- Keep extra Markdown docs in the skill root (avoid new subdirectories).
- Use `scripts/` for helper scripts referenced from `SKILL.md`.
- Use `templates/` for reusable template files referenced from `SKILL.md`.
