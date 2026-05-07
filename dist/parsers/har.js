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
exports.parseHAR = parseHAR;
exports.parseHARFromString = parseHARFromString;
const fs = __importStar(require("fs"));
const IGNORED_EXTENSIONS = ['.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webp'];
const IGNORED_DOMAINS = ['google-analytics.com', 'googletagmanager.com', 'hotjar.com', 'intercom.io', 'segment.com', 'sentry.io', 'doubleclick.net', 'facebook.com/tr'];
const IGNORED_METHODS = ['OPTIONS'];
function shouldIgnoreEntry(entry) {
    const url = entry.request.url;
    const method = entry.request.method;
    if (IGNORED_METHODS.includes(method))
        return true;
    if (IGNORED_DOMAINS.some(d => url.includes(d)))
        return true;
    if (IGNORED_EXTENSIONS.some(ext => url.split('?')[0].endsWith(ext)))
        return true;
    return false;
}
function isNavigationEntry(entry) {
    const ct = entry.response.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
    return (ct.includes('text/html') ||
        entry.response.status === 301 ||
        entry.response.status === 302);
}
function isAPIEntry(entry) {
    const ct = entry.response.headers.find(h => h.name.toLowerCase() === 'content-type')?.value || '';
    return ct.includes('application/json') || ct.includes('application/xml');
}
function cleanUrl(url, baseUrl) {
    if (baseUrl && url.startsWith(baseUrl)) {
        return url.slice(baseUrl.length) || '/';
    }
    try {
        const u = new URL(url);
        return u.pathname + u.search;
    }
    catch {
        return url;
    }
}
function extractAPIRequest(entry) {
    const headers = {};
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
function parseHAR(filePath, baseUrl) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    let har;
    try {
        har = JSON.parse(raw);
    }
    catch {
        throw new Error(`Invalid HAR file: ${filePath} — could not parse JSON`);
    }
    if (!har.log?.entries) {
        throw new Error(`Invalid HAR file: missing log.entries`);
    }
    const steps = [];
    let lastUrl = '';
    for (const entry of har.log.entries) {
        if (shouldIgnoreEntry(entry))
            continue;
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
        }
        else if (isAPIEntry(entry)) {
            steps.push({
                type: 'api',
                apiRequest: extractAPIRequest(entry),
                comment: `${entry.request.method} ${cleanUrl(url, baseUrl)}`,
            });
        }
    }
    return steps;
}
function parseHARFromString(content, baseUrl) {
    let har;
    try {
        har = JSON.parse(content);
    }
    catch {
        throw new Error('Invalid HAR content — could not parse JSON');
    }
    const tmpFile = `/tmp/qapulsesk-gen-${Date.now()}.har`;
    fs.writeFileSync(tmpFile, content);
    const result = parseHAR(tmpFile, baseUrl);
    fs.unlinkSync(tmpFile);
    return result;
}
//# sourceMappingURL=har.js.map