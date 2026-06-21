const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GEMINI_MODEL = 'gemini-2.5-flash';

const DEFAULT_TIMEOUT_MS = 15_000;
const RETRY_DELAY_MS = 2_000;

let _groqRateLimited = false;

export function resetFallbackState() {
  _groqRateLimited = false;
}

export function activeProvider() {
  return _groqRateLimited ? 'gemini' : 'groq';
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function callGroq(env, systemPrompt, userPrompt, maxTokens, temperature) {
  const res = await fetchWithTimeout(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature,
      response_format: { type: 'json_object' },
    }),
  });

  if (res.status === 429) {
    throw new GroqRateLimitError('Groq daily rate limit reached');
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

async function callGemini(env, systemPrompt, userPrompt, maxTokens, temperature) {
  const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}

class GroqRateLimitError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GroqRateLimitError';
  }
}

export async function callLLM(env, systemPrompt, userPrompt, options = {}) {
  const { maxTokens = 1024, temperature = 0.3 } = options;

  if (_groqRateLimited) {
    return callGemini(env, systemPrompt, userPrompt, maxTokens, temperature);
  }

  try {
    return await callGroq(env, systemPrompt, userPrompt, maxTokens, temperature);
  } catch (err) {
    if (err instanceof GroqRateLimitError) {
      console.warn('[LLM] Groq rate-limited — falling back to Gemini for this request');
      _groqRateLimited = true;
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      return callGemini(env, systemPrompt, userPrompt, maxTokens, temperature);
    }
    throw err;
  }
}

export function parseLLMResponse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${raw.slice(0, 200)}…`);
  }
}
