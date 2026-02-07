/**
 * YAML frontmatter parsing utilities (dependency-free)
 *
 * Parses simple YAML frontmatter from Markdown files.
 * Supports flat key-value pairs with optional quoted values.
 *
 * Usage:
 *   import { parseFrontmatter, extractFrontmatterBlock } from './lib/frontmatter.mjs';
 *
 *   const { front, body } = parseFrontmatter(content);
 *   console.log(front.name, front.description);
 */

/**
 * Parse YAML frontmatter from Markdown content.
 * Supports flat "key: value" pairs with optional quoted values.
 *
 * @param {string} content - Markdown content starting with ---
 * @returns {{ front: Record<string, string>, body: string } | { error: string } | null}
 *          Returns null if no frontmatter found, error object if invalid, or parsed result.
 */
export function parseFrontmatter(content) {
  if (!content || !content.startsWith('---')) return null;

  const idx = content.indexOf('\n---', 3);
  if (idx === -1) return null;

  const raw = content.slice(3, idx).trim().replace(/\r\n/g, '\n');
  const body = content.slice(idx + '\n---'.length).replace(/^\s*\n/, '');

  const front = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;

    // Match "key: value" pattern, allowing colons in the value
    const m = t.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
    if (!m) {
      return { error: `Invalid frontmatter line: "${line}"` };
    }

    const k = m[1];
    let v = (m[2] ?? '').trim();

    // Remove surrounding quotes if present
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }

    front[k] = v;
  }

  return { front, body };
}

/**
 * Extract the full frontmatter block including delimiters.
 * Useful for stub generation where the entire block needs to be preserved.
 *
 * @param {string} content - Markdown content
 * @returns {{ full: string, yaml: string, rest: string } | null}
 */
export function extractFrontmatterBlock(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const full = match[0];
  const yaml = match[1];
  const rest = content.slice(full.length);

  return { full, yaml, rest };
}

