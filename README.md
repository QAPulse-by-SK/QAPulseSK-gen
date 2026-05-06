# QAPulseSK-gen

[![npm version](https://img.shields.io/npm/v/qapulsesk-gen?style=for-the-badge&color=3b82f6)](https://www.npmjs.com/package/qapulsesk-gen)
[![npm downloads](https://img.shields.io/npm/dm/qapulsesk-gen?style=for-the-badge&color=22c55e)](https://www.npmjs.com/package/qapulsesk-gen)
[![License: MIT](https://img.shields.io/badge/License-MIT-a78bfa?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-22c55e?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![QAPulse by SK](https://img.shields.io/badge/QAPulse%20by%20SK-Test%20Automation%20Hub-3b82f6?style=for-the-badge)](https://skakarh.com)

> **Stop writing boilerplate. Start from what you already have.**
> HAR files · Playwright recordings · Plain English → Playwright or Cypress tests in seconds.

---

## ✨ Why QAPulseSK-gen?

| Input | Other tools | QAPulseSK-gen |
|---|---|---|
| HAR file | Manual conversion | ✅ Auto-generates clean tests |
| Playwright recording | Raw codegen output | ✅ Cleaned up + assertions added |
| Plain English | Not supported | ✅ AI converts description to test |
| Output framework | One framework only | ✅ Playwright **and** Cypress |
| AI enhancement | Paid / separate tool | ✅ Opt-in, your key, zero cost to us |
| POM generation | Manual | ✅ Built-in flag |

---

## 🚀 Install

```bash
npm install -g qapulsesk-gen
# or use locally
npm install qapulsesk-gen --save-dev
```

---

## 📖 CLI Usage

### From HAR file

```bash
# Record in Chrome DevTools → Network → Export HAR
qapulsesk-gen from-har my-session.har \
  --framework playwright \
  --language typescript \
  --output tests/ \
  --name "Login Flow" \
  --base-url https://myapp.com
```

### From Playwright recording

```bash
# Record with: npx playwright codegen myapp.com --save-storage=auth.json
qapulsesk-gen from-recording recording.json \
  --framework cypress \
  --language typescript \
  --output cypress/e2e/
```

### From plain English (requires AI key)

```bash
qapulsesk-gen from-text \
  "Go to the login page, enter email test@example.com and password Secret123, click Login, verify the dashboard loads and the user menu shows the email address" \
  --framework playwright \
  --language typescript \
  --ai-key $ANTHROPIC_API_KEY \
  --ai-provider anthropic \
  --name "Login Flow"
```

### With AI enhancement (cleans up HAR noise, adds assertions)

```bash
qapulsesk-gen from-har session.har \
  --framework playwright \
  --ai-key $ANTHROPIC_API_KEY \
  --ai-provider anthropic
```

### Generate with Page Object Model

```bash
qapulsesk-gen from-har session.har \
  --framework playwright \
  --language typescript \
  --pom \
  --name "Checkout Flow"
```

---

## 📖 Programmatic API

```typescript
import { generate } from 'qapulsesk-gen';

const result = await generate(
  './my-session.har',
  'har',
  'Login Flow',
  {
    framework: 'playwright',
    language: 'typescript',
    outputDir: 'tests/',
    baseUrl: 'https://myapp.com',
    usePOM: false,

    // 🤖 AI enhancement — optional, your key, zero cost to us
    ai: {
      enabled: true,
      provider: 'anthropic', // 'anthropic' | 'openai' | 'gemini'
      apiKey: process.env.AI_API_KEY,
    },
  }
);

console.log(`Generated ${result.summary.testsGenerated} test(s) with ${result.summary.stepsGenerated} steps`);
```

---

## ⚙️ CLI Options

| Option | Description | Default |
|---|---|---|
| `--framework` | `playwright` or `cypress` | `playwright` |
| `--language` | `typescript` or `javascript` | `typescript` |
| `--output` | Output directory | `qapulsesk-tests` |
| `--name` | Test suite name | `Generated Test` |
| `--base-url` | Strip base URL from HAR requests | — |
| `--pom` | Generate Page Object Model files | `false` |
| `--ai-key` | Your AI API key (optional) | — |
| `--ai-provider` | `anthropic`, `openai`, or `gemini` | `anthropic` |

---

## 🤖 AI Enhancement (Optional)

**Free by default.** AI is opt-in — provide your own key, we never call any AI service without it.

When enabled, AI will:
- Remove noise steps (analytics, CDN, tracking)
- Add meaningful assertions after key actions
- Improve fragile selectors
- Add comments explaining test sections

```bash
# Anthropic (recommended)
--ai-key $ANTHROPIC_API_KEY --ai-provider anthropic

# OpenAI
--ai-key $OPENAI_API_KEY --ai-provider openai

# Google Gemini
--ai-key $GEMINI_API_KEY --ai-provider gemini
```

---

## 📦 What gets generated

**Without POM:**
```
qapulsesk-tests/
└── login-flow.spec.ts
```

**With POM (`--pom`):**
```
qapulsesk-tests/
├── tests/login-flow.spec.ts
└── pages/LoginFlowPage.ts
```

**Cypress:**
```
qapulsesk-tests/
└── cypress/e2e/login-flow.cy.ts
```

---

## 📬 Links

| | |
|---|---|
| 🌐 Website | [skakarh.com](https://skakarh.com) |
| 📦 npm | [npmjs.com/package/qapulsesk-gen](https://www.npmjs.com/package/qapulsesk-gen) |
| 🐛 Issues | [GitHub Issues](https://github.com/QAPulse-by-SK/QAPulseSK-gen/issues) |
| 💼 LinkedIn | [company/qapulsebysk](https://linkedin.com/company/qapulsebysk) |
| 🐦 Twitter/X | [@qapulsebysk](https://twitter.com/qapulsebysk) |

---

**Built with ❤️ by [QAPulse by SK](https://skakarh.com)**

*If this saved you time, please ⭐ the repo — it helps others find it!*
