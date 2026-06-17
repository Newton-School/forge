/**
 * Client fetch helpers. The browser/SSR talks only to the Forge API — these add a
 * request timeout and exponential backoff with jitter for **idempotent reads** (GETs).
 * Mutations (POST/PATCH/DELETE) must NOT use retry — a re-send could duplicate the
 * action; they stay single-attempt in `lib/api`.
 */
const DEFAULT_TIMEOUT_MS = 10_000;
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function backoffDelayMs(attempt: number, base: number, max: number, retryAfter?: string | null): number {
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (!Number.isNaN(secs) && secs >= 0) return Math.min(secs * 1000, max);
  }
  return Math.min(base * 2 ** attempt + Math.random() * base, max);
}

export interface RetryOptions {
  timeoutMs?: number;
  retries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/** GET with timeout + exponential backoff. For reads only (idempotent). */
export async function fetchRetry(url: string, init: RequestInit = {}, opts: RetryOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 3, baseDelayMs = 300, maxDelayMs = 15_000 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (RETRYABLE_STATUS.has(res.status) && attempt < retries) {
        await sleep(backoffDelayMs(attempt, baseDelayMs, maxDelayMs, res.headers.get("retry-after")));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt >= retries) break;
      await sleep(backoffDelayMs(attempt, baseDelayMs, maxDelayMs));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr;
}
