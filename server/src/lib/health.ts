/** Pure health payload — extracted so it's unit-testable without booting the server. */
export function healthPayload(now: Date = new Date()) {
  return { status: "ok" as const, service: "forge-server", time: now.toISOString() };
}
