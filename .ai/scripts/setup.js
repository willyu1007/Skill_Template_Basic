#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

const VALID_PROVIDERS = ['claude', 'codex', 'cursor', 'copilot', 'gemini'];

const colors = {
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  gray: (s) => `\x1b[90m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function setup() {
  console.log(colors.cyan('========================================'));
  console.log(colors.cyan('   AI-Friendly Repository Setup'));
  console.log(colors.cyan('========================================'));
  console.log('');

  // 1. Choose Provider
  let provider = '';
  while (!VALID_PROVIDERS.includes(provider)) {
    console.log(colors.gray(`Available providers: ${VALID_PROVIDERS.join(', ')}`));
    provider = (await ask('Choose your AI assistant provider: ')).toLowerCase();
    
    if (!VALID_PROVIDERS.includes(provider)) {
      console.log(colors.red(`Invalid provider. Please choose from: ${VALID_PROVIDERS.join(', ')}`));
    }
  }

  // 2. Run Adapter
  console.log('');
  const adaptScript = path.join(__dirname, 'adapt.js');
  execSync(`node "${adaptScript}" ${provider}`, { stdio: 'inherit' });

  // 3. Project Profile Initialization
  console.log('');
  console.log(colors.cyan('Initializing project profile...'));
  
  let projectName = await ask('Enter project name (default: my-ai-project): ');
  if (!projectName) {
    projectName = 'my-ai-project';
  }

  const projectDir = path.join('init', projectName);
  fs.mkdirSync(projectDir, { recursive: true });

  // Copy template if exists
  const templatePath = '.ai/templates/project-profile.md';
  if (fs.existsSync(templatePath)) {
    let content = fs.readFileSync(templatePath, 'utf-8');
    content = content.replace(/\{\{PROJECT_NAME\}\}/g, projectName);
    fs.writeFileSync(path.join(projectDir, 'profile.md'), content);
    console.log(colors.green(`Created project profile at ${projectDir}/profile.md`));
  }

  console.log('');
  console.log(colors.cyan('========================================'));
  console.log(colors.green('  Setup Complete!'));
  console.log(colors.cyan('========================================'));
  console.log(`  Provider: ${provider} (.${provider}/)`);
  console.log(`  Profile:  ${projectDir}/profile.md`);
  console.log('');
  console.log(colors.gray('  Switch providers: node .ai/scripts/switch.js <provider>'));
  console.log(colors.cyan('========================================'));

  rl.close();
}

setup().catch((err) => {
  console.error(colors.red('Setup failed:'), err.message);
  rl.close();
  process.exit(1);
});



