/**
 * Outbound HTTP helpers for integration adapters. Every external call must be
 * time-bounded so a hung upstream (GitHub / Discord / Google) can't pin a request
 * or a background job. `fetchWithRetry` adds exponential backoff with jitter for
 * **idempotent** calls (GETs, auth token exchanges) — never use it for non-idempotent
 * writes (e.g. creating a calendar event), where a retry could duplicate the action.
 */
const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Transient statuses worth retrying: rate limit + the 5xx family + request timeout. */
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
export const isRetryableStatus = (status: number): boolean => RETRYABLE_STATUS.has(status);

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export interface RetryOptions {
  timeoutMs?: number;
  retries?: number; // additional attempts after the first
  baseDelayMs?: number; // backoff base; delay = base * 2^attempt + jitter
  maxDelayMs?: number;
}

/**
 * Compute the backoff delay for an attempt. Honors a `Retry-After` header (seconds)
 * when the upstream provides one (GitHub/Discord rate limits); otherwise exponential
 * with full jitter, capped at `maxDelayMs`.
 */
export function backoffDelayMs(attempt: number, baseDelayMs: number, maxDelayMs: number, retryAfter?: string | null): number {
  if (retryAfter) {
    const secs = Number(retryAfter);
    if (!Number.isNaN(secs) && secs >= 0) return Math.min(secs * 1000, maxDelayMs);
  }
  const exp = baseDelayMs * 2 ** attempt;
  const jitter = Math.random() * baseDelayMs;
  return Math.min(exp + jitter, maxDelayMs);
}

/**
 * Time-bounded fetch with exponential backoff for IDEMPOTENT requests. Retries on
 * network/timeout errors and transient HTTP statuses; returns the final Response
 * (which the caller still checks) once retries are exhausted.
 */
export async function fetchWithRetry(url: string, init: RequestInit = {}, opts: RetryOptions = {}): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = 3, baseDelayMs = 300, maxDelayMs = 15_000 } = opts;
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      if (isRetryableStatus(res.status) && attempt < retries) {
        await sleep(backoffDelayMs(attempt, baseDelayMs, maxDelayMs, res.headers.get("retry-after")));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err; // network error or timeout abort
      if (attempt >= retries) break;
      await sleep(backoffDelayMs(attempt, baseDelayMs, maxDelayMs));
    }
  }
  throw lastErr;
}
