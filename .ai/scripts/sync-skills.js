#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const skillsRoot = path.join(repoRoot, '.ai', 'skills');
const targetRoots = [
  { name: 'codex', dir: path.join(repoRoot, '.codex', 'skills') },
  { name: 'claude', dir: path.join(repoRoot, '.claude', 'skills') },
];

const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function readFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) {
    return null;
  }
  return `---\n${match[1]}\n---\n\n`;
}

function extractName(frontmatter, fallback) {
  if (!frontmatter) return fallback;
  const match = frontmatter.match(/^name:\s*(.+)$/m);
  return match ? match[1].trim() : fallback;
}

function resetDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function listSkillDirs() {
  if (!fs.existsSync(skillsRoot)) {
    console.error(colors.red(`Missing skills root: ${skillsRoot}`));
    process.exit(1);
  }

  return fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_meta')
    .map((entry) => entry.name)
    .sort();
}

function buildStub(skillName, sourceContent) {
  const frontmatter = readFrontmatter(sourceContent)
    || `---\nname: ${skillName}\ndescription: See .ai/skills/${skillName}/SKILL.md\n---\n\n`;
  const frontmatterBlock = frontmatter.trimEnd();
  const displayName = extractName(frontmatterBlock, skillName);

  return [
    frontmatterBlock,
    '',
    `# ${displayName} (entry)`,
    '',
    `Canonical source: \`.ai/skills/${skillName}/\``,
    `Open \`.ai/skills/${skillName}/SKILL.md\` and any supporting files referenced there (for example \`reference.md\`, \`examples.md\`, \`scripts/\`, \`templates/\`).`,
    '',
  ].join('\n');
}

function sync() {
  console.log(colors.cyan('========================================'));
  console.log(colors.cyan('  Syncing skill stubs'));
  console.log(colors.cyan('========================================'));

  const skills = listSkillDirs();
  if (skills.length === 0) {
    console.log(colors.red('No skills found to sync.'));
    process.exit(1);
  }

  for (const target of targetRoots) {
    resetDir(target.dir);
    console.log('');
    console.log(colors.green(`Writing ${target.name} stubs...`));

    for (const skillName of skills) {
      const sourcePath = path.join(skillsRoot, skillName, 'SKILL.md');
      if (!fs.existsSync(sourcePath)) {
        console.log(colors.gray(`  [!] Missing SKILL.md for ${skillName}, skipped`));
        continue;
      }

      const content = fs.readFileSync(sourcePath, 'utf8');
      const stub = buildStub(skillName, content);

      const targetDir = path.join(target.dir, skillName);
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(path.join(targetDir, 'SKILL.md'), stub, 'utf8');
      console.log(colors.gray(`  [+] ${skillName}`));
    }
  }

  console.log('');
  console.log(colors.cyan('========================================'));
  console.log(colors.green('  Skill stubs synced'));
  console.log(colors.cyan('========================================'));
}

sync();
