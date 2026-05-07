import { TestStep, AIGenConfig } from '../core/types';
export declare function naturalLanguageToSteps(description: string, config: AIGenConfig): Promise<TestStep[]>;
export declare function enhanceSteps(steps: TestStep[], config: AIGenConfig, framework: string): Promise<TestStep[]>;
//# sourceMappingURL=generator.d.ts.map