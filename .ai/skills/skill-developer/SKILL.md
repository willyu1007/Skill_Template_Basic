---
name: skill-developer
description: Meta-skill for creating and managing skills following the official specification. Use when creating new skills, understanding skill structure, trigger patterns (keywords, intent patterns), or implementing progressive disclosure (the 500-line rule). Covers skill folder organization, YAML frontmatter, and best practices for instructions.
---

# Skill Developer Guide

## Purpose
Comprehensive guide for creating and managing skills in AI-friendly repositories, following official best practices including the 500-line rule and progressive disclosure pattern.

## When to Use This Skill
Use this skill when:
- Creating or adding new skills to the repository.
- Modifying skill descriptions or instructions.
- Understanding how LLMs identify and activate skills.
- Organizing skills with supporting files.
- Implementing the 500-line rule for efficient context management.

---

## Skill Types

### 1. Guardrail Skills
**Purpose:** Provide critical instructions and constraints to prevent common errors.
**Characteristics:**
- Focus on mandatory rules and validation steps.
- Provide clear warnings and required actions.
- Used for critical tasks like database schema verification or architectural compliance.

### 2. Domain Skills
**Purpose:** Provide comprehensive guidance and knowledge for specific technical areas.
**Characteristics:**
- Focus on best practices, patterns, and architectural guidance.
- Advisory in nature, providing "how-to" information.
- Modularized with supporting files for deep dives.

---

## Quick Start: Creating a New Skill

### Step 1: Create Skill Directory and File
**Location:** `.ai/skills/{skill-name}/SKILL.md`

**Template:**
```markdown
---
name: my-new-skill
description: |
  Brief description including keywords that help the LLM identify this skill.
  Mention topics, file types, and specific use cases.
---

# My New Skill

## Purpose
What this skill helps with.

## When to Use
Specific scenarios and conditions for activation.

## Instructions
The actual guidance, documentation, patterns, and examples.
```

### Step 2: Follow Best Practices
- **Name**: Lowercase, hyphenated (kebab-case).
- **Description**: Include trigger keywords/phrases (max 1024 chars).
- **Content**: Keep the main file under 500 lines and use supporting files for details.
- **Examples**: Include real-world code examples.
- **Structure**: Use clear headings, bullet points, and code blocks.

---

## The 500-Line Rule & Progressive Disclosure

Large skill files can exceed the LLM's efficient context window or increase token costs. To manage this:

1. **Main SKILL.md**: Keep it under 500 lines. It should provide an overview, high-level instructions, and navigate to detailed supporting files.
2. **Supporting files**: Move detailed patterns, API references, or complex examples to separate files alongside `SKILL.md` (for example `reference.md`, `examples.md`, or `scripts/` and `templates/`).
3. **Disclosure**: The LLM loads the main skill first and only requests specific supporting files when needed for the task at hand.

---

## Supporting Files

For detailed information on specific topics, refer to:

- [reference.md](reference.md): Trigger patterns, structure rules, pattern library, advanced topics, and troubleshooting.
