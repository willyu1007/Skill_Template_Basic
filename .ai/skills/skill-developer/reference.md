# Reference

## Trigger Design - Complete Guide

Design guide for ensuring LLMs correctly identify and activate the right skills based on user input and project context.

---

### Implicit Activation (Keywords & Intent)

LLMs identify relevant skills by matching the user's prompt against the skill's `description` and `name`.

#### Keyword Optimization
Include specific, unambiguous terms that the user is likely to use.
- **Good**: "Prisma", "Express middleware", "React Suspense".
- **Bad**: "code", "file", "improvement".

#### Intent Matching
Describe the *actions* the user might be performing.
- **Example**: "Use this skill when implementing new API endpoints or refactoring existing routes."

---

### Contextual Activation (File Triggers)

When the LLM is focused on specific files, it uses the skill's configuration (defined in SSOT and mapped to provider artifacts) to suggest relevant guidance.

#### Path Patterns
Skills should specify which parts of the repository they apply to.
- **Frontend**: `src/features/**/*.tsx`
- **Backend**: `server/src/**/*.ts`
- **Configuration**: `**/config/*.yaml`

#### Content Detection
Identifying technologies by the code itself.
- **Example**: Detecting `import { PrismaClient } from '@prisma/client'` should trigger database-related skills.

---

### Best Practices Summary

#### DO:
- ✅ Use specific, unambiguous keywords.
- ✅ Include common variations of terms (e.g., "auth" and "authentication").
- ✅ Describe the "When to Use" scenario clearly in the `description`.
- ✅ Test the skill by asking the LLM questions about its domain.

#### DON'T:
- ❌ Use overly generic keywords that cause false positives.
- ❌ Make the description too long (keep it under 1024 characters).
- ❌ Overlap trigger keywords across multiple skills unless they are related.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- Skill rules reference - Skill metadata reference
- Patterns library - Ready-to-use patterns

---

## Skill SSOT Reference

Documentation on the standard structure and metadata for skills within the AI-friendly repository template.

---

### Skill Directory Structure

Every skill is a self-contained directory under `.ai/skills/`:

```
<skill-name>/
├── SKILL.md                  # Required: Main instructions + frontmatter
├── reference.md              # Optional: Detailed reference
├── examples.md               # Optional: Usage examples
├── scripts/                  # Optional: Helper scripts
│   └── helper.ext
└── templates/                # Optional: Reusable templates
    └── template.ext
```

Supporting files live alongside `SKILL.md`. Avoid adding additional subdirectories beyond `scripts/` and `templates/`.

### SKILL.md Frontmatter Specification

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

### Content Organization Rules

1. **The 500-Line Rule**: The `SKILL.md` file should be concise (ideally under 500 lines). Extensive details should be moved to supporting files (`reference.md`, `examples.md`, or content referenced from `scripts/` and `templates/`).
2. **Progressive Disclosure**: Use the main file for navigation and critical paths. Use supporting files for specialized topics.
3. **SSOT Principle**: The contents in `.ai/skills/` and `.ai/commands/` are the only source of truth. Entry stubs (like `.codex/skills/` or `.claude/skills/`) are generated from here.

### Naming Conventions

- **Skill Name**: Use kebab-case (e.g., `skill-developer`, `route-tester`).
- **Supporting Files**: Use kebab-case or snake_case, but stay consistent within the skill.
- **Triggers**: Use clear, unambiguous keywords that represent the domain or action.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- Trigger types - Detailed trigger documentation
- Patterns library - Pattern library

---

## Common Skill Patterns Library

Ready-to-use patterns for skill triggers and structure. Use these as building blocks when creating new skills in the SSOT.

---

### Intent Detection Patterns (Regex)

These patterns help describe the user's intent in the skill's metadata `description` or `intentPatterns` fields.

#### Feature/Endpoint Creation
```regex
(add|create|implement|build).*?(feature|endpoint|route|service|controller)
```

#### Component Creation
```regex
(create|add|make|build).*?(component|UI|page|modal|dialog|form)
```

#### Database Operations
```regex
(add|create|modify|update).*?(user|table|column|field|schema|migration)
```

#### Error Handling
```regex
(fix|handle|catch|debug).*?(error|exception|bug)
```

#### Technical Explanations
```regex
(how does|how do|explain|what is|describe|tell me about).*?
```

---

### File Organization Patterns (SSOT)

#### Standard Skill Structure
```
.ai/skills/<skill-name>/
├── SKILL.md                  # Main overview and instructions
├── reference.md              # Detailed reference (optional)
├── examples.md               # Examples (optional)
├── scripts/                  # Helper scripts (optional)
└── templates/                # Reusable templates (optional)
```

#### Workflow Skill Structure
```
.ai/skills/<workflow-name>/
└── SKILL.md                  # Workflow instructions and steps
```

---

### Instruction Patterns

#### The Checklist Pattern
Use this for skills that provide "guardrail" guidance:
```markdown
## Checklist
- [ ] Verify the input parameters match the schema.
- [ ] Check for existing utility functions before implementing.
- [ ] Ensure error handling blocks are present.
```

#### The "How-To" Pattern
Use this for domain-specific knowledge:
```markdown
## Implementation Steps
1. Define the interface in `types.ts`.
2. Implement the core logic in the `Service` class.
3. Add unit tests covering the happy path and edge cases.
```

---

### Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- Trigger types - Detailed trigger documentation
- Advanced topics - Advanced design topics

---

## Advanced Skill Design Topics

This document covers advanced concepts for organizing and refining skills for better LLM performance and maintainability.

---

### Skill Dependencies

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

### Performance & Context Optimization

**Concept:** Optimizing how skills are structured to minimize token usage and maximize the LLM's understanding.

**Best Practices:**
- **Keyword Density**: Place the most critical trigger keywords in the first 200 characters of the `description`.
- **Instruction Precision**: Use imperative language for instructions (e.g., "Verify schema before writing queries" instead of "It is recommended to verify schema").
- **Minimal Examples**: Provide enough examples to show the pattern, but move extensive edge cases to resource files.

---

### Multi-Language Considerations

**Concept:** Supporting projects where multiple languages are used or the team is international.

**Implementation Ideas:**
- Provide instructions that account for naming convention differences across languages (e.g., camelCase in TS vs snake_case in Python).
- Use universal technical terms in keywords to ensure activation regardless of the prompt language.
- Maintain English as the primary language for SSOT to ensure compatibility across different LLM providers.

---

### Skill Evolution and Versioning

**Concept:** Tracking changes to skills over time.

**Best Practices:**
- Use a `CHANGELOG.md` in the skill's resource directory for complex skills.
- Explicitly state compatible framework versions in the skill description (e.g., "Supports React 18+").
- Use the `metadata` field in frontmatter for internal version tracking if needed.

---

### Related Files

- [SKILL.md](../SKILL.md) - Main skill guide
- Patterns library - Ready-to-use patterns
- Trigger types - Detailed trigger documentation

---

## Troubleshooting Skill Activation

Guide for resolving issues when skills are not being correctly used by the LLM.

---

### Skill Not Triggering

#### 1. Incomplete Description
**Problem:** The LLM doesn't realize the skill is relevant to the current task.
**Fix:** Update the `description` in the frontmatter to include more specific keywords and describe the intent more clearly.

#### 2. Context Window Limits
**Problem:** The skill file is too large, causing the LLM to ignore parts of it or fail to load it.
**Fix:** Apply the **500-line rule**. Move detailed information into supporting files and use the main `SKILL.md` for high-level navigation.

#### 3. Naming Conflicts
**Problem:** Two skills have similar names or overlapping keywords, confusing the LLM.
**Fix:** Rename skills to be more distinct and refine the trigger keywords to be more unique to each domain.

#### 4. Incorrect Path Mapping
**Problem:** The skill is only relevant to specific files, but the LLM doesn't know which ones.
**Fix:** Ensure the `pathPatterns` in the provider configuration (or generated artifacts) correctly point to the relevant directories in your project.

---

### Skill Providing Irrelevant Information

#### 1. Overly Broad Keywords
**Problem:** The skill triggers on generic terms (e.g., "fix", "update").
**Fix:** Remove generic terms and replace them with specific domain-focused keywords.

#### 2. Outdated Content
**Problem:** The skill contains patterns that no longer apply to the project.
**Fix:** Regularly review and update the SSOT content to reflect current project standards.

---

### Debugging Workflow

1. **Verify SSOT**: Check if the source file in `.ai/skills/` is correct.
2. **Check Artifacts**: Verify that the generated files in `.codex/skills/` or `.claude/skills/` match the source.
3. **Prompt Test**: Ask the LLM: "Which skills are available for [Topic]?" or "How should I implement [Feature] according to our skills?"
4. **Refine Triggers**: Adjust keywords and descriptions based on the LLM's response.

---

### Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- Trigger types - Trigger design guide
