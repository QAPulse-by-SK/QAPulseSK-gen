#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const path = __importStar(require("path"));
const orchestrator_1 = require("../core/orchestrator");
const program = new commander_1.Command();
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
    .action(async (file, options) => {
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
    .action(async (file, options) => {
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
    .action(async (description, options) => {
    if (!options.aiKey) {
        console.error('\n❌ --ai-key is required for text input.\n');
        process.exit(1);
    }
    await runGeneration(description, 'natural-language', options);
});
async function runGeneration(input, inputType, options) {
    console.log('\n🚀 QAPulseSK-gen by QAPulse by SK\n');
    const config = {
        framework: options.framework || 'playwright',
        language: options.language || 'typescript',
        outputDir: options.output || 'qapulsesk-tests',
        baseUrl: options.baseUrl,
        usePOM: Boolean(options.pom),
        ai: options.aiKey
            ? {
                enabled: true,
                provider: options.aiProvider || 'anthropic',
                apiKey: options.aiKey,
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
        const result = await (0, orchestrator_1.generate)(input, inputType, options.name || 'Generated Test', config);
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
    }
    catch (err) {
        console.error(`\n❌ Error: ${err.message}\n`);
        process.exit(1);
    }
}
program.parse(process.argv);
//# sourceMappingURL=index.js.map