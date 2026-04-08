/**
 * Multi-AI Summary: call multiple LLM providers (OpenAI, Gemini, Grok) with the same prompt
 * and aggregate results. All API keys are read from environment variables (never from client).
 */

export type ProviderResult = {
  provider: string;
  text: string;
  error?: string;
};

const SUMMARY_SYSTEM =
  'You are a helpful tutor. In 2–4 short paragraphs, give a clear, accurate summary. Be concise.';

/**
 * OpenAI (ChatGPT): https://platform.openai.com/docs/api-reference/chat
 */
export async function getOpenAISummary(prompt: string): Promise<ProviderResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.trim()) {
    return { provider: 'ChatGPT', text: '', error: 'OPENAI_API_KEY not set' };
  }
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SUMMARY_SYSTEM },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { provider: 'ChatGPT', text: '', error: `API ${res.status}: ${err.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data?.choices?.[0]?.message?.content?.trim() ?? '';
    return { provider: 'ChatGPT', text: text || 'No content returned.' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { provider: 'ChatGPT', text: '', error: msg };
  }
}

/**
 * Google Gemini: https://ai.google.dev/api/rest/v1/models/generateContent
 */
export async function getGeminiSummary(prompt: string): Promise<ProviderResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    return { provider: 'Gemini', text: '', error: 'GEMINI_API_KEY not set' };
  }
  try {
    // Use widely available Gemini model + v1 API
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SUMMARY_SYSTEM}\n\n${prompt}` }] }],
        generationConfig: { maxOutputTokens: 600, temperature: 0.3 },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { provider: 'Gemini', text: '', error: `API ${res.status}: ${err.slice(0, 200)}` };
    }
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const text = part?.text?.trim() ?? '';
    return { provider: 'Gemini', text: text || 'No content returned.' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { provider: 'Gemini', text: '', error: msg };
  }
}

/**
 * xAI Grok: OpenAI-compatible endpoint https://docs.x.ai/docs/guides/chat-completions
 */
export async function getGrokSummary(prompt: string): Promise<ProviderResult> {
  const key = process.env.XAI_API_KEY;
  if (!key?.trim()) {
    return { provider: 'Grok', text: '', error: 'XAI_API_KEY not set' };
  }
  try {
    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: SUMMARY_SYSTEM },
          { role: 'user', content: prompt },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { provider: 'Grok', text: '', error: `API ${res.status}: ${err.slice(0, 200)}` };
    }
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const text = data?.choices?.[0]?.message?.content?.trim() ?? '';
    return { provider: 'Grok', text: text || 'No content returned.' };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { provider: 'Grok', text: '', error: msg };
  }
}

/** Call all configured providers in parallel and return combined result. */
export async function getAllSummaries(prompt: string): Promise<ProviderResult[]> {
  const tasks: Promise<ProviderResult>[] = [];

  if (process.env.OPENAI_API_KEY?.trim()) {
    tasks.push(getOpenAISummary(prompt));
  }
  if (process.env.GEMINI_API_KEY?.trim()) {
    tasks.push(getGeminiSummary(prompt));
  }
  if (process.env.XAI_API_KEY?.trim()) {
    tasks.push(getGrokSummary(prompt));
  }

  if (tasks.length === 0) {
    return [
      {
        provider: 'System',
        text: '',
        error: 'No AI providers are configured on the server. Set at least one API key in .env.',
      },
    ];
  }

  return Promise.all(tasks);
}

/** Build a single combined summary text from all provider results (for display and storage). */
export function combineSummaryResults(results: ProviderResult[]): string {
  const parts: string[] = [];
  for (const r of results) {
    if (r.error) {
      parts.push(`[${r.provider}]: Error — ${r.error}`);
    } else if (r.text) {
      parts.push(`[${r.provider}]:\n${r.text}`);
    }
  }
  return parts.join('\n\n---\n\n');
}

/** Comma-separated list of providers that returned content (for storage). */
export function providersUsedList(results: ProviderResult[]): string {
  return results.filter((r) => !r.error && r.text).map((r) => r.provider).join(',');
}
