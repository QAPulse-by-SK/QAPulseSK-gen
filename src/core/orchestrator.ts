import * as fs from 'fs';
import * as path from 'path';
import { QAPulseGenConfig, TestStep, GenerationResult, InputType } from './types';
import { parseHAR } from '../parsers/har';
import { parsePlaywrightRecording } from '../parsers/recording';
import { naturalLanguageToSteps, enhanceSteps } from '../ai/generator';
import { generatePlaywrightTests } from '../generators/playwright';
import { generateCypressTests } from '../generators/cypress';

export async function generate(
  input: string,
  inputType: InputType,
  testName: string,
  config: QAPulseGenConfig
): Promise<GenerationResult> {
  const startTime = Date.now();
  const outputDir = config.outputDir || 'qapulsesk-tests';

  // 1. Parse input into normalised steps
  let steps: TestStep[];

  if (inputType === 'har') {
    steps = parseHAR(input, config.baseUrl);
  } else if (inputType === 'recording') {
    steps = parsePlaywrightRecording(input);
  } else if (inputType === 'natural-language') {
    if (!config.ai?.enabled || !config.ai?.apiKey) {
      throw new Error('Natural language input requires AI to be enabled with an API key.\n\nAdd: --ai-key YOUR_KEY');
    }
    steps = await naturalLanguageToSteps(input, config.ai);
  } else {
    throw new Error(`Unknown input type: ${inputType}`);
  }

  if (steps.length === 0) {
    throw new Error('No test steps could be extracted from the input.');
  }

  // 2. AI enhancement (optional)
  if (config.ai?.enabled && config.ai?.apiKey && inputType !== 'natural-language') {
    steps = await enhanceSteps(steps, config.ai, config.framework);
  }

  // 3. Generate test code
  let result: { tests: import('./types').GeneratedTest[]; pomFiles?: import('./types').GeneratedFile[] };

  if (config.framework === 'playwright') {
    result = generatePlaywrightTests(steps, testName, config);
  } else {
    result = generateCypressTests(steps, testName, config);
  }

  // 4. Write files
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const test of result.tests) {
    const filePath = path.join(outputDir, test.filename);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, test.content, 'utf-8');
  }

  if (result.pomFiles) {
    for (const pom of result.pomFiles) {
      const filePath = path.join(outputDir, pom.filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, pom.content, 'utf-8');
    }
  }

  return {
    tests: result.tests,
    pomFiles: result.pomFiles,
    summary: {
      inputType,
      framework: config.framework,
      language: config.language,
      testsGenerated: result.tests.length,
      stepsGenerated: steps.length,
      aiEnhanced: !!(config.ai?.enabled && config.ai?.apiKey),
      outputDir,
      duration: Date.now() - startTime,
    },
  };
}
