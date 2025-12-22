# Troubleshooting Skill Activation

Guide for resolving issues when skills are not being correctly used by the LLM.

---

## Skill Not Triggering

### 1. Incomplete Description
**Problem:** The LLM doesn't realize the skill is relevant to the current task.
**Fix:** Update the `description` in the frontmatter to include more specific keywords and describe the intent more clearly.

### 2. Context Window Limits
**Problem:** The skill file is too large, causing the LLM to ignore parts of it or fail to load it.
**Fix:** Apply the **500-line rule**. Move detailed information into resource files and use the main `SKILL.md` for high-level navigation.

### 3. Naming Conflicts
**Problem:** Two skills have similar names or overlapping keywords, confusing the LLM.
**Fix:** Rename skills to be more distinct and refine the trigger keywords to be more unique to each domain.

### 4. Incorrect Path Mapping
**Problem:** The skill is only relevant to specific files, but the LLM doesn't know which ones.
**Fix:** Ensure the `pathPatterns` in the provider configuration (or generated artifacts) correctly point to the relevant directories in your project.

---

## Skill Providing Irrelevant Information

### 1. Overly Broad Keywords
**Problem:** The skill triggers on generic terms (e.g., "fix", "update").
**Fix:** Remove generic terms and replace them with specific domain-focused keywords.

### 2. Outdated Content
**Problem:** The skill contains patterns that no longer apply to the project.
**Fix:** Regularly review and update the SSOT content to reflect current project standards.

---

## Debugging Workflow

1. **Verify SSOT**: Check if the source file in `.ai/ssot/skills/` is correct.
2. **Check Artifacts**: Verify that the generated files in `.codex/skills/` or `.claude/skills/` match the source.
3. **Prompt Test**: Ask the LLM: "Which skills are available for [Topic]?" or "How should I implement [Feature] according to our skills?"
4. **Refine Triggers**: Adjust keywords and descriptions based on the LLM's response.

---

## Related Files
- [SKILL.md](../SKILL.md) - Main skill guide
- [TRIGGER_TYPES.md](TRIGGER_TYPES.md) - Trigger design guide

