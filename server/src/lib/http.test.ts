import { describe, it, expect, vi, afterEach } from "vitest";
import { isRetryableStatus, backoffDelayMs, fetchWithRetry } from "./http.js";

afterEach(() => vi.unstubAllGlobals());

describe("isRetryableStatus", () => {
  it("retries transient statuses, not client/success ones", () => {
    for (const s of [408, 425, 429, 500, 502, 503, 504]) expect(isRetryableStatus(s)).toBe(true);
    for (const s of [200, 201, 301, 400, 401, 403, 404, 422]) expect(isRetryableStatus(s)).toBe(false);
  });
});

describe("backoffDelayMs", () => {
  it("honors Retry-After (seconds), capped at maxDelay", () => {
    expect(backoffDelayMs(0, 300, 15_000, "2")).toBe(2000);
    expect(backoffDelayMs(0, 300, 15_000, "100")).toBe(15_000); // 100s capped to 15s
  });
  it("grows exponentially within [exp, exp+base] and caps at maxDelay", () => {
    const d0 = backoffDelayMs(0, 100, 15_000); // 100 + jitter[0,100)
    const d2 = backoffDelayMs(2, 100, 15_000); // 400 + jitter[0,100)
    expect(d0).toBeGreaterThanOrEqual(100);
    expect(d0).toBeLessThan(200);
    expect(d2).toBeGreaterThanOrEqual(400);
    expect(d2).toBeLessThan(500);
    expect(backoffDelayMs(10, 100, 1_000)).toBe(1_000); // 100*2^10 capped
  });
});

describe("fetchWithRetry", () => {
  it("retries transient statuses then succeeds", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 503 }))
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x", {}, { baseDelayMs: 0, retries: 3 });
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns the last response after exhausting retries", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x", {}, { baseDelayMs: 0, retries: 2 });
    expect(res.status).toBe(503);
    expect(fetchMock).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("does not retry a non-transient status", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);
    const res = await fetchWithRetry("https://x", {}, { baseDelayMs: 0, retries: 3 });
    expect(res.status).toBe(404);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries network errors then gives up", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchWithRetry("https://x", {}, { baseDelayMs: 0, retries: 2 })).rejects.toThrow("ECONNRESET");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
