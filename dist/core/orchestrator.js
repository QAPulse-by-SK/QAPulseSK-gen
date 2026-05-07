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
exports.generate = generate;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const har_1 = require("../parsers/har");
const recording_1 = require("../parsers/recording");
const generator_1 = require("../ai/generator");
const playwright_1 = require("../generators/playwright");
const cypress_1 = require("../generators/cypress");
async function generate(input, inputType, testName, config) {
    const startTime = Date.now();
    const outputDir = config.outputDir || 'qapulsesk-tests';
    // 1. Parse input into normalised steps
    let steps;
    if (inputType === 'har') {
        steps = (0, har_1.parseHAR)(input, config.baseUrl);
    }
    else if (inputType === 'recording') {
        steps = (0, recording_1.parsePlaywrightRecording)(input);
    }
    else if (inputType === 'natural-language') {
        if (!config.ai?.enabled || !config.ai?.apiKey) {
            throw new Error('Natural language input requires AI to be enabled with an API key.\n\nAdd: --ai-key YOUR_KEY');
        }
        steps = await (0, generator_1.naturalLanguageToSteps)(input, config.ai);
    }
    else {
        throw new Error(`Unknown input type: ${inputType}`);
    }
    if (steps.length === 0) {
        throw new Error('No test steps could be extracted from the input.');
    }
    // 2. AI enhancement (optional)
    if (config.ai?.enabled && config.ai?.apiKey && inputType !== 'natural-language') {
        steps = await (0, generator_1.enhanceSteps)(steps, config.ai, config.framework);
    }
    // 3. Generate test code
    let result;
    if (config.framework === 'playwright') {
        result = (0, playwright_1.generatePlaywrightTests)(steps, testName, config);
    }
    else {
        result = (0, cypress_1.generateCypressTests)(steps, testName, config);
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
//# sourceMappingURL=orchestrator.js.map