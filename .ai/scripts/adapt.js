#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const VALID_PROVIDERS = ['claude', 'codex', 'cursor', 'copilot', 'gemini'];
const SOURCE_DIR = '.ai/ssot';

// Colors for console output
const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function printHeader(provider) {
  console.log(colors.cyan('========================================'));
  console.log(colors.cyan(`  SSOT -> ${provider} Adapter`));
  console.log(colors.cyan('========================================'));
}

function printSummary(targetDir, stats) {
  console.log('');
  console.log(colors.cyan('========================================'));
  console.log(colors.green('  Adaptation Complete!'));
  console.log(colors.cyan('========================================'));
  console.log(`  Target:    ${targetDir}`);
  console.log(`  Skills:    ${stats.skills}`);
  console.log(`  Workflows: ${stats.workflows}`);
  console.log(`  Commands:  ${stats.commands}`);
  console.log(colors.cyan('========================================'));
}

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function removeDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function countDirs(dir) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isDirectory()).length;
}

function countFiles(dir, ext = '.md') {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(ext)).length;
}

function adapt(provider) {
  if (!VALID_PROVIDERS.includes(provider)) {
    console.error(colors.red(`Invalid provider: ${provider}`));
    console.error(`Valid providers: ${VALID_PROVIDERS.join(', ')}`);
    process.exit(1);
  }

  const targetDir = `.${provider}`;
  
  printHeader(provider);

  // Clean existing target directory
  if (fs.existsSync(targetDir)) {
    console.log(colors.yellow(`Removing existing ${targetDir}...`));
    removeDir(targetDir);
  }

  console.log(colors.green(`Creating ${targetDir} structure...`));

  // Provider-specific directory mapping
  const skillsTarget = path.join(targetDir, 'skills');

  // Codex only supports skills. Keep its repo artifacts strict to the official layout.
  const supportsCommands = provider !== 'codex';
  const supportsWorkflows = provider !== 'codex';

  const commandsTarget = supportsCommands ? path.join(targetDir, 'commands') : null;
  // Claude uses "agents" for workflows, others use "workflows"
  const workflowsTarget = supportsWorkflows
    ? path.join(targetDir, provider === 'claude' ? 'agents' : 'workflows')
    : null;

  fs.mkdirSync(skillsTarget, { recursive: true });
  if (workflowsTarget) fs.mkdirSync(workflowsTarget, { recursive: true });
  if (commandsTarget) fs.mkdirSync(commandsTarget, { recursive: true });

  // 1. Sync Skills
  console.log('');
  console.log(colors.green('Syncing Skills...'));
  const skillsSource = path.join(SOURCE_DIR, 'skills');
  
  if (fs.existsSync(skillsSource)) {
    const entries = fs.readdirSync(skillsSource, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(skillsSource, entry.name);
      const destPath = path.join(skillsTarget, entry.name);
      
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
        console.log(colors.gray(`  [+] ${entry.name}`));
      } else if (entry.name === 'skill-rules.json' && provider === 'claude') {
        fs.copyFileSync(srcPath, destPath);
        console.log(colors.gray(`  [+] ${entry.name}`));
      }
    }
  }

  // 2. Sync Workflows
  if (workflowsTarget) {
    console.log('');
    console.log(colors.green('Syncing Workflows...'));
    const workflowsSource = path.join(SOURCE_DIR, 'workflows');

    if (fs.existsSync(workflowsSource)) {
      const files = fs.readdirSync(workflowsSource).filter(f => f.endsWith('.md'));
      for (const file of files) {
        fs.copyFileSync(
          path.join(workflowsSource, file),
          path.join(workflowsTarget, file)
        );
        console.log(colors.gray(`  [+] ${file}`));
      }
    }
  }

  // 3. Sync Commands
  if (commandsTarget) {
    console.log('');
    console.log(colors.green('Syncing Commands...'));
    const commandsSource = path.join(SOURCE_DIR, 'commands');

    if (fs.existsSync(commandsSource)) {
      const files = fs.readdirSync(commandsSource).filter(f => f.endsWith('.md'));
      for (const file of files) {
        fs.copyFileSync(
          path.join(commandsSource, file),
          path.join(commandsTarget, file)
        );
        console.log(colors.gray(`  [+] ${file}`));
      }
    }
  }

  // 4. Generate provider-specific entry file
  console.log('');
  console.log(colors.green(`Generating entry file...`));
  
  const entryFiles = {
    claude: 'CLAUDE.md',
    codex: 'AGENTS.md',
    cursor: '.cursorrules',
    copilot: 'AGENTS.md',
    gemini: 'AGENTS.md',
  };
  
  const entryFile = entryFiles[provider];
  if (entryFile && fs.existsSync('AGENTS.md')) {
    if (entryFile === 'AGENTS.md') {
      console.log(colors.gray(`  Using existing AGENTS.md`));
    } else {
      fs.copyFileSync('AGENTS.md', entryFile);
      console.log(colors.gray(`  [+] ${entryFile} (from AGENTS.md)`));
    }
  }

  // 5. Provider-specific adaptations
  console.log('');
  console.log(colors.green(`Applying ${provider}-specific adaptations...`));
  
  switch (provider) {
    case 'claude':
      console.log(colors.gray('  Claude Code format (agents/ for workflows)'));
      break;
    case 'cursor':
      console.log(colors.gray('  Cursor format (.cursorrules entry)'));
      break;
    case 'copilot':
      console.log(colors.gray('  Copilot format'));
      break;
    case 'codex':
      console.log(colors.gray('  Codex format (skills only)'));
      break;
    case 'gemini':
      console.log(colors.gray('  Gemini format'));
      break;
  }

  // Summary
  const stats = {
    skills: countDirs(skillsTarget),
    workflows: workflowsTarget ? countFiles(workflowsTarget) : 0,
    commands: commandsTarget ? countFiles(commandsTarget) : 0,
  };

  printSummary(targetDir, stats);
}

// Main
const provider = process.argv[2]?.toLowerCase();

if (!provider) {
  console.log('Usage: node adapt.js <provider>');
  console.log(`Valid providers: ${VALID_PROVIDERS.join(', ')}`);
  process.exit(1);
}

adapt(provider);


