import * as fs from 'fs';
import { HARFile, HAREntry, TestStep, APIRequest } from '../core/types';

const IGNORED_EXTENSIONS = ['.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webp'];
const IGNORED_DOMAINS = ['google-analytics.com', 'googletagmanager.com', 'hotjar.com', 'intercom.io', 'segment.com', 'sentry.io', 'doubleclick.net', 'facebook.com/tr'];
const IGNORED_METHODS = ['OPTIONS'];

function shouldIgnoreEntry(entry: HAREntry): boolean {
  const url = entry.request.url;
  const method = entry.request.method;

  if (IGNORED_METHODS.includes(method)) return true;
  if (IGNORED_DOMAINS.some(d => url.includes(d))) return true;
  if (IGNORED_EXTENSIONS.some(ext => url.split('?')[0].endsWith(ext))) return true;

  return false;
}

function isNavigationEntry(entry: HAREntry): boolean {
  const ct = entry.response.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  return (
    ct.includes('text/html') ||
    entry.response.status === 301 ||
    entry.response.status === 302
  );
}

function isAPIEntry(entry: HAREntry): boolean {
  const ct = entry.response.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
  return ct.includes('application/json') || ct.includes('application/xml');
}

function cleanUrl(url: string, baseUrl?: string): string {
  if (baseUrl && url.startsWith(baseUrl)) {
    return url.slice(baseUrl.length) || '/';
  }
  try {
    const u = new URL(url);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

function extractAPIRequest(entry: HAREntry): APIRequest {
  const headers: Record<string, string> = {};
  const importantHeaders = ['content-type', 'authorization', 'accept'];
  for (const h of entry.request.headers) {
    if (importantHeaders.includes(h.name.toLowerCase())) {
      headers[h.name] = h.value;
    }
  }

  return {
    method: entry.request.method,
    url: entry.request.url,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: entry.request.postData?.text,
    expectedStatus: entry.response.status,
  };
}

export function parseHAR(filePath: string, baseUrl?: string): TestStep[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let har: HARFile;

  try {
    har = JSON.parse(raw) as HARFile;
  } catch {
    throw new Error(`Invalid HAR file: ${filePath} — could not parse JSON`);
  }

  if (!har.log?.entries) {
    throw new Error(`Invalid HAR file: missing log.entries`);
  }

  const steps: TestStep[] = [];
  let lastUrl = '';

  for (const entry of har.log.entries) {
    if (shouldIgnoreEntry(entry)) continue;

    const url = entry.request.url;

    if (isNavigationEntry(entry)) {
      const cleanedUrl = cleanUrl(url, baseUrl);
      if (cleanedUrl !== lastUrl) {
        steps.push({ type: 'navigate', url: cleanedUrl });
        lastUrl = cleanedUrl;

        // Add URL assertion after navigation
        steps.push({
          type: 'assert',
          assertion: { type: 'url', expected: cleanedUrl },
        });
      }
    } else if (isAPIEntry(entry)) {
      steps.push({
        type: 'api',
        apiRequest: extractAPIRequest(entry),
        comment: `${entry.request.method} ${cleanUrl(url, baseUrl)}`,
      });
    }
  }

  return steps;
}

export function parseHARFromString(content: string, baseUrl?: string): TestStep[] {
  let har: HARFile;
  try {
    har = JSON.parse(content) as HARFile;
  } catch {
    throw new Error('Invalid HAR content — could not parse JSON');
  }

  const tmpFile = `/tmp/qapulsesk-gen-${Date.now()}.har`;
  fs.writeFileSync(tmpFile, content);
  const result = parseHAR(tmpFile, baseUrl);
  fs.unlinkSync(tmpFile);
  return result;
}
