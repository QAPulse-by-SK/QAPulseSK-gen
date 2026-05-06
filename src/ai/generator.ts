import { TestStep, AIGenConfig, QAPulseGenConfig } from '../core/types';

const NL_SYSTEM_PROMPT = `You are an expert QA automation engineer. Convert the user's plain English description into a structured list of test steps.

Respond ONLY with a JSON array of steps. Each step must have:
- type: "navigate" | "click" | "fill" | "select" | "check" | "press" | "assert" | "hover" | "screenshot"
- selector (CSS or text-based, e.g. "text=Login", "[data-testid=submit]", "button:has-text('Submit')")
- url (for navigate steps only)
- value (for fill/select steps)
- key (for press steps)
- assertion (for assert steps): { type: "visible"|"text"|"url"|"title", selector?, expected? }
- comment (optional human-readable note)

Be specific. Use realistic selectors. Include assertions after key actions.
Respond ONLY with the JSON array, no explanation, no markdown.`;

const ENHANCE_SYSTEM_PROMPT = `You are an expert QA automation engineer. You are given a list of raw test steps (from a HAR file or recording).
Your job is to:
1. Remove noise steps (tracking, analytics, CDN assets)
2. Add meaningful assertions after key interactions
3. Add comments explaining what each section does
4. Group related steps logically
5. Suggest better selectors if the ones provided look fragile

Respond ONLY with the improved JSON array of steps. Same structure as input. No explanation, no markdown.`;

async function callAI(systemPrompt: string, userPrompt: string, config: AIGenConfig): Promise<string | null> {
  const provider = config.provider || 'anthropic';
  const apiKey = config.apiKey!;

  try {
    if (provider === 'anthropic') {
      const model = config.model || 'claude-3-5-haiku-20241022';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { content: Array<{ type: string; text: string }> };
      return data.content.find(c => c.type === 'text')?.text || null;
    }

    if (provider === 'openai') {
      const model = config.model || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { choices: Array<{ message: { content: string } }> };
      return data.choices[0]?.message?.content || null;
    }

    if (provider === 'gemini') {
      const model = config.model || 'gemini-1.5-flash';
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { maxOutputTokens: 4096 },
          }),
        }
      );
      if (!res.ok) return null;
      const data = await res.json() as { candidates: Array<{ content: { parts: Array<{ text: string }> } }> };
      return data.candidates[0]?.content?.parts[0]?.text || null;
    }
  } catch {
    return null;
  }

  return null;
}

function parseSteps(raw: string): TestStep[] {
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as TestStep[];
  } catch {
    return [];
  }
}

export async function naturalLanguageToSteps(description: string, config: AIGenConfig): Promise<TestStep[]> {
  const raw = await callAI(NL_SYSTEM_PROMPT, description, config);
  if (!raw) throw new Error('AI returned no response. Check your API key and provider.');
  const steps = parseSteps(raw);
  if (steps.length === 0) throw new Error('AI could not parse test steps from the description.');
  return steps;
}

export async function enhanceSteps(steps: TestStep[], config: AIGenConfig, framework: string): Promise<TestStep[]> {
  if (!config.enabled || !config.apiKey) return steps;

  const prompt = `Framework: ${framework}\n\nSteps:\n${JSON.stringify(steps, null, 2)}`;
  const raw = await callAI(ENHANCE_SYSTEM_PROMPT, prompt, config);
  if (!raw) return steps; // Fall back to original on failure

  const enhanced = parseSteps(raw);
  return enhanced.length > 0 ? enhanced : steps;
}
