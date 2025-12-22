# Advanced Skill Design Topics

This document covers advanced concepts for organizing and refining skills for better LLM performance and maintainability.

---

## Skill Dependencies

**Concept:** Large domains may benefit from having multiple specialized skills that depend on a foundational "base" skill.

**Use Cases:**
- An advanced refactoring skill that builds on basic architectural guidelines.
- Specialized API testing skills that rely on a base authentication skill.
- Chaining complex workflows across multiple specialized agents.

**Benefits:**
- Better modularity.
- Clearer separation of concerns.
- Avoids hitting context limits in a single skill file.

---

## Performance & Context Optimization

**Concept:** Optimizing how skills are structured to minimize token usage and maximize the LLM's understanding.

**Best Practices:**
- **Keyword Density**: Place the most critical trigger keywords in the first 200 characters of the `description`.
- **Instruction Precision**: Use imperative language for instructions (e.g., "Verify schema before writing queries" instead of "It is recommended to verify schema").
- **Minimal Examples**: Provide enough examples to show the pattern, but move extensive edge cases to resource files.

---

## Multi-Language Considerations

**Concept:** Supporting projects where multiple languages are used or the team is international.

**Implementation Ideas:**
- Provide instructions that account for naming convention differences across languages (e.g., camelCase in TS vs snake_case in Python).
- Use universal technical terms in keywords to ensure activation regardless of the prompt language.
- Maintain English as the primary language for SSOT to ensure compatibility across different LLM providers.

---

## Skill Evolution and Versioning

**Concept:** Tracking changes to skills over time.

**Best Practices:**
- Use a `CHANGELOG.md` in the skill's resource directory for complex skills.
- Explicitly state compatible framework versions in the skill description (e.g., "Supports React 18+").
- Use the `metadata` field in frontmatter for internal version tracking if needed.

---

## Related Files

- [SKILL.md](../SKILL.md) - Main skill guide
- [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md) - Ready-to-use patterns
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Detailed trigger documentation

