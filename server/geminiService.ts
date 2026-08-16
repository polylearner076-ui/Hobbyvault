import { GoogleGenAI } from '@google/genai';

/**
 * Robust execution wrapper for Gemini API calls with automatic retry and model fallback.
 * When a model encounters temporary high demand (503 / 429), it automatically retries with backoff
 * and falls back to resilient alias models like 'gemini-flash-latest' or 'gemini-3.1-flash-lite'.
 */
export async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: {
    primaryModel?: string;
    contents: any;
    config?: any;
    maxRetries?: number;
  }
) {
  const primaryModel = params.primaryModel || 'gemini-3.7-flash';
  const fallbackModels = [
    primaryModel,
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];
  // Deduplicate in order
  const modelsToTry = Array.from(new Set(fallbackModels));
  const maxRetries = params.maxRetries ?? 2;

  let lastError: any = null;

  for (const model of modelsToTry) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        const statusCode = err?.status || err?.code || err?.error?.code;
        const errorMsg = String(err?.message || err?.error?.message || '');
        const isTransient =
          statusCode === 503 ||
          statusCode === 429 ||
          errorMsg.includes('high demand') ||
          errorMsg.includes('UNAVAILABLE') ||
          errorMsg.includes('RESOURCE_EXHAUSTED') ||
          errorMsg.includes('Overloaded');

        if (isTransient && attempt < maxRetries) {
          // Exponential jittered backoff: 300ms, 700ms
          const delayMs = attempt * 350 + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // If not transient or out of attempts for this model, break and try next fallback model
        break;
      }
    }
  }

  throw lastError;
}
