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
exports.parsePlaywrightRecording = parsePlaywrightRecording;
const fs = __importStar(require("fs"));
function mapAction(action) {
    switch (action.action) {
        case 'navigate':
            return { type: 'navigate', url: action.url };
        case 'click':
            return { type: 'click', selector: action.selector };
        case 'fill':
        case 'type':
            return { type: 'fill', selector: action.selector, value: action.text || action.value };
        case 'select':
            return { type: 'select', selector: action.selector, value: action.value };
        case 'check':
        case 'uncheck':
            return { type: 'check', selector: action.selector, value: action.action };
        case 'press':
            return { type: 'press', selector: action.selector, key: action.key };
        case 'hover':
            return { type: 'hover', selector: action.selector };
        case 'assertText':
        case 'assertValue': {
            const assertion = {
                type: action.action === 'assertText' ? 'text' : 'value',
                selector: action.selector,
                expected: action.value,
            };
            return { type: 'assert', assertion };
        }
        case 'assertVisible': {
            return {
                type: 'assert',
                assertion: { type: 'visible', selector: action.selector },
            };
        }
        case 'screenshot':
            return { type: 'screenshot', comment: 'Visual checkpoint' };
        case 'waitForURL':
            return {
                type: 'assert',
                assertion: { type: 'url', expected: action.url },
            };
        default:
            return null;
    }
}
function parsePlaywrightRecording(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    let recording;
    try {
        recording = JSON.parse(raw);
    }
    catch {
        throw new Error(`Invalid Playwright recording: ${filePath}`);
    }
    if (!recording.actions) {
        throw new Error('Invalid Playwright recording: missing actions array');
    }
    const steps = [];
    for (const action of recording.actions) {
        const step = mapAction(action);
        if (step)
            steps.push(step);
    }
    // Deduplicate consecutive navigations to same URL
    return steps.filter((step, i) => {
        if (step.type !== 'navigate')
            return true;
        const prev = steps[i - 1];
        return !prev || prev.type !== 'navigate' || prev.url !== step.url;
    });
}
//# sourceMappingURL=recording.js.map