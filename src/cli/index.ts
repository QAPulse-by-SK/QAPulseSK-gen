#!/usr/bin/env node

import { Command } from 'commander';
import * as path from 'path';
import { generate } from '../core/orchestrator';
import { QAPulseGenConfig, Framework, Language, InputType } from '../core/types';

const program = new Command();

program
  .name('qapulsesk-gen')
  .description('QAPulseSK-gen — All-in-one test generator by QAPulse by SK\nhttps://skakarh.com')
  .version('1.0.0');

program
  .command('from-har <file>')
  .description('Generate tests from a HAR file')
  .option('-f, --framework <framework>', 'playwright or cypress', 'playwright')
  .option('-l, --language <language>', 'typescript or javascript', 'typescript')
  .option('-o, --output <dir>', 'output directory', 'qapulsesk-tests')
  .option('-n, --name <name>', 'test name', 'Generated Test')
  .option('--base-url <url>', 'base URL to strip from requests')
  .option('--pom', 'generate Page Object Model files', false)
  .option('--ai-key <key>', 'AI API key for enhanced output (optional)')
  .option('--ai-provider <provider>', 'anthropic, openai, or gemini', 'anthropic')
  .action(async (file: string, options) => {
    await runGeneration(path.resolve(file), 'har', options);
  });

program
  .command('from-recording <file>')
  .description('Generate tests from a Playwright recording JSON')
  .option('-f, --framework <framework>', 'playwright or cypress', 'playwright')
  .option('-l, --language <language>', 'typescript or javascript', 'typescript')
  .option('-o, --output <dir>', 'output directory', 'qapulsesk-tests')
  .option('-n, --name <name>', 'test name', 'Generated Test')
  .option('--base-url <url>', 'base URL')
  .option('--pom', 'generate Page Object Model files', false)
  .option('--ai-key <key>', 'AI API key for enhanced output (optional)')
  .option('--ai-provider <provider>', 'anthropic, openai, or gemini', 'anthropic')
  .action(async (file: string, options) => {
    await runGeneration(path.resolve(file), 'recording', options);
  });

program
  .command('from-text <description>')
  .description('Generate tests from a plain English description (requires AI key)')
  .option('-f, --framework <framework>', 'playwright or cypress', 'playwright')
  .option('-l, --language <language>', 'typescript or javascript', 'typescript')
  .option('-o, --output <dir>', 'output directory', 'qapulsesk-tests')
  .option('-n, --name <name>', 'test name', 'Generated Test')
  .option('--base-url <url>', 'base URL')
  .option('--pom', 'generate Page Object Model files', false)
  .option('--ai-key <key>', 'AI API key (required for text input)')
  .option('--ai-provider <provider>', 'anthropic, openai, or gemini', 'anthropic')
  .action(async (description: string, options) => {
    if (!options.aiKey) {
      console.error('\n❌ --ai-key is required for text input.\n');
      process.exit(1);
    }
    await runGeneration(description, 'natural-language', options);
  });

async function runGeneration(input: string, inputType: InputType, options: Record<string, string | boolean>) {
  console.log('\n🚀 QAPulseSK-gen by QAPulse by SK\n');

  const config: QAPulseGenConfig = {
    framework: (options.framework as Framework) || 'playwright',
    language: (options.language as Language) || 'typescript',
    outputDir: (options.output as string) || 'qapulsesk-tests',
    baseUrl: options.baseUrl as string | undefined,
    usePOM: Boolean(options.pom),
    ai: options.aiKey
      ? {
          enabled: true,
          provider: (options.aiProvider as 'anthropic' | 'openai' | 'gemini') || 'anthropic',
          apiKey: options.aiKey as string,
        }
      : { enabled: false },
  };

  console.log(`   Input type : ${inputType}`);
  console.log(`   Framework  : ${config.framework}`);
  console.log(`   Language   : ${config.language}`);
  console.log(`   Output dir : ${config.outputDir}`);
  console.log(`   AI enhanced: ${config.ai?.enabled ? `✅ (${config.ai.provider})` : '❌ (free mode)'}`);
  console.log(`   POM        : ${config.usePOM ? '✅' : '❌'}`);
  console.log('');

  try {
    const result = await generate(input, inputType, (options.name as string) || 'Generated Test', config);
    const { summary } = result;

    console.log(`✅ Done in ${summary.duration}ms\n`);
    console.log(`   Tests generated : ${summary.testsGenerated}`);
    console.log(`   Steps extracted : ${summary.stepsGenerated}`);
    console.log(`   Output directory: ${summary.outputDir}\n`);

    for (const test of result.tests) {
      console.log(`   📄 ${test.filename}`);
    }

    if (result.pomFiles) {
      for (const pom of result.pomFiles) {
        console.log(`   📄 ${pom.filename} (POM)`);
      }
    }

    console.log('\n   Built by QAPulse by SK · https://skakarh.com\n');
  } catch (err) {
    console.error(`\n❌ Error: ${(err as Error).message}\n`);
    process.exit(1);
  }
}

program.parse(process.argv);
