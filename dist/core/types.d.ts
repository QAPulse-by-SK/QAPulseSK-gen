export type Framework = 'playwright' | 'cypress';
export type Language = 'typescript' | 'javascript';
export type InputType = 'har' | 'recording' | 'natural-language';
export interface QAPulseGenConfig {
    framework: Framework;
    language: Language;
    outputDir?: string;
    baseUrl?: string;
    includeAssertions?: boolean;
    usePOM?: boolean;
    ai?: AIGenConfig;
    cleanUp?: boolean;
}
export interface AIGenConfig {
    enabled: boolean;
    provider?: 'anthropic' | 'openai' | 'gemini';
    apiKey?: string;
    model?: string;
}
export interface HARFile {
    log: HARLog;
}
export interface HARLog {
    version: string;
    creator: {
        name: string;
        version: string;
    };
    entries: HAREntry[];
}
export interface HAREntry {
    startedDateTime: string;
    time: number;
    request: HARRequest;
    response: HARResponse;
}
export interface HARRequest {
    method: string;
    url: string;
    httpVersion: string;
    headers: HARHeader[];
    queryString: HARQueryParam[];
    postData?: HARPostData;
    bodySize: number;
}
export interface HARResponse {
    status: number;
    statusText: string;
    headers: HARHeader[];
    content: HARContent;
}
export interface HARHeader {
    name: string;
    value: string;
}
export interface HARQueryParam {
    name: string;
    value: string;
}
export interface HARPostData {
    mimeType: string;
    text?: string;
    params?: Array<{
        name: string;
        value: string;
    }>;
}
export interface HARContent {
    size: number;
    mimeType: string;
    text?: string;
}
export interface PlaywrightRecording {
    actions: PlaywrightAction[];
}
export interface PlaywrightAction {
    action: string;
    selector?: string;
    url?: string;
    text?: string;
    value?: string;
    key?: string;
    signals?: PlaywrightSignal[];
    isAssert?: boolean;
}
export interface PlaywrightSignal {
    name: string;
    url?: string;
    isAsync?: boolean;
}
export interface TestStep {
    type: 'navigate' | 'click' | 'fill' | 'select' | 'check' | 'press' | 'wait' | 'assert' | 'api' | 'screenshot' | 'hover';
    selector?: string;
    url?: string;
    value?: string;
    key?: string;
    assertion?: Assertion;
    comment?: string;
    apiRequest?: APIRequest;
}
export interface Assertion {
    type: 'url' | 'title' | 'visible' | 'text' | 'value' | 'status' | 'count';
    selector?: string;
    expected?: string | number;
}
export interface APIRequest {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: string;
    expectedStatus?: number;
}
export interface GeneratedTest {
    filename: string;
    content: string;
    framework: Framework;
    language: Language;
    inputType: InputType;
    stepCount: number;
}
export interface GenerationResult {
    tests: GeneratedTest[];
    pomFiles?: GeneratedFile[];
    summary: GenerationSummary;
}
export interface GeneratedFile {
    filename: string;
    content: string;
}
export interface GenerationSummary {
    inputType: InputType;
    framework: Framework;
    language: Language;
    testsGenerated: number;
    stepsGenerated: number;
    aiEnhanced: boolean;
    outputDir: string;
    duration: number;
}
//# sourceMappingURL=types.d.ts.map