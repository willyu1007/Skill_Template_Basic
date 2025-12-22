# Common Skill Patterns Library

Ready-to-use patterns for skill triggers and structure. Use these as building blocks when creating new skills in the SSOT.

---

## Intent Detection Patterns (Regex)

These patterns help describe the user's intent in the skill's metadata `description` or `intentPatterns` fields.

### Feature/Endpoint Creation
```regex
(add|create|implement|build).*?(feature|endpoint|route|service|controller)
```

### Component Creation
```regex
(create|add|make|build).*?(component|UI|page|modal|dialog|form)
```

### Database Operations
```regex
(add|create|modify|update).*?(user|table|column|field|schema|migration)
```

### Error Handling
```regex
(fix|handle|catch|debug).*?(error|exception|bug)
```

### Technical Explanations
```regex
(how does|how do|explain|what is|describe|tell me about).*?
```

---

## File Organization Patterns (SSOT)

### Standard Skill Structure
```
.ai/ssot/skills/<skill-name>/
├── SKILL.md                  # Main overview and instructions
└── resources/                # Detailed technical deep-dives
    ├── patterns.md
    ├── examples.md
    └── references.md
```

### Workflow Structure
```
.ai/ssot/workflows/
└── <workflow-name>.md        # Intent-based procedure guide
```

---

## Instruction Patterns

### The Checklist Pattern
Use this for skills that provide "guardrail" guidance:
```markdown
## Checklist
- [ ] Verify the input parameters match the schema.
- [ ] Check for existing utility functions before implementing.
- [ ] Ensure error handling blocks are present.
```

### The "How-To" Pattern
Use this for domain-specific knowledge:
```markdown
## Implementation Steps
1. Define the interface in `types.ts`.
2. Implement the core logic in the `Service` class.
3. Add unit tests covering the happy path and edge cases.
```

---

## Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Detailed trigger documentation
- [ADVANCED.md](ADVANCED.md) - Advanced design topics

