# Trigger Design - Complete Guide

Design guide for ensuring LLMs correctly identify and activate the right skills based on user input and project context.

---

## Implicit Activation (Keywords & Intent)

LLMs identify relevant skills by matching the user's prompt against the skill's `description` and `name`.

### Keyword Optimization
Include specific, unambiguous terms that the user is likely to use.
- **Good**: "Prisma", "Express middleware", "React Suspense".
- **Bad**: "code", "file", "improvement".

### Intent Matching
Describe the *actions* the user might be performing.
- **Example**: "Use this skill when implementing new API endpoints or refactoring existing routes."

---

## Contextual Activation (File Triggers)

When the LLM is focused on specific files, it uses the skill's configuration (defined in SSOT and mapped to provider artifacts) to suggest relevant guidance.

### Path Patterns
Skills should specify which parts of the repository they apply to.
- **Frontend**: `src/features/**/*.tsx`
- **Backend**: `server/src/**/*.ts`
- **Configuration**: `**/config/*.yaml`

### Content Detection
Identifying technologies by the code itself.
- **Example**: Detecting `import { PrismaClient } from '@prisma/client'` should trigger database-related skills.

---

## Best Practices Summary

### DO:
- ✅ Use specific, unambiguous keywords.
- ✅ Include common variations of terms (e.g., "auth" and "authentication").
- ✅ Describe the "When to Use" scenario clearly in the `description`.
- ✅ Test the skill by asking the LLM questions about its domain.

### DON'T:
- ❌ Use overly generic keywords that cause false positives.
- ❌ Make the description too long (keep it under 1024 characters).
- ❌ Overlap trigger keywords across multiple skills unless they are related.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- [SKILL_RULES_REFERENCE.md](SKILL_RULES_REFERENCE.md) - Skill metadata reference
- [PATTERNS_LIBRARY.md](PATTERNS_LIBRARY.md) - Ready-to-use patterns

