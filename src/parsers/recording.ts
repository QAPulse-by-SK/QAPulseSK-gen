import * as fs from 'fs';
import { PlaywrightRecording, PlaywrightAction, TestStep, Assertion } from '../core/types';

function mapAction(action: PlaywrightAction): TestStep | null {
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
      const assertion: Assertion = {
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

export function parsePlaywrightRecording(filePath: string): TestStep[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let recording: PlaywrightRecording;

  try {
    recording = JSON.parse(raw) as PlaywrightRecording;
  } catch {
    throw new Error(`Invalid Playwright recording: ${filePath}`);
  }

  if (!recording.actions) {
    throw new Error('Invalid Playwright recording: missing actions array');
  }

  const steps: TestStep[] = [];

  for (const action of recording.actions) {
    const step = mapAction(action);
    if (step) steps.push(step);
  }

  // Deduplicate consecutive navigations to same URL
  return steps.filter((step, i) => {
    if (step.type !== 'navigate') return true;
    const prev = steps[i - 1];
    return !prev || prev.type !== 'navigate' || prev.url !== step.url;
  });
}
