import crypto from "node:crypto";

/**
 * Pure GitHub webhook helpers — signature verification and event normalization.
 * No I/O, fully unit-tested. The HTTP layer supplies the raw bytes + headers.
 */

/**
 * Verify GitHub's `X-Hub-Signature-256` header against the raw body using a
 * timing-safe comparison. GitHub signs as `sha256=<hex hmac>`.
 */
export function verifyGithubSignature(rawBody: Buffer | string, signatureHeader: string | undefined, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signatureHeader);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch — guard first.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export type ActivityType = "COMMIT" | "PR" | "ISSUE" | "REVIEW";

export interface NormalizedActivity {
  type: ActivityType;
  externalId: string;
  title: string | null;
  state: string | null;
  url: string | null;
  occurredAt: Date;
  githubLogin: string | null;
  repo: string | null;
}

/**
 * Normalize a GitHub webhook payload into zero or more activity rows.
 * Supports push (one row per commit), pull_request, issues, pull_request_review.
 * Unknown events return []. `deliveryId` disambiguates externalIds when needed.
 */
export function normalizeEvent(eventName: string, payload: unknown, deliveryId = ""): NormalizedActivity[] {
  const p = (payload ?? {}) as Record<string, any>;
  const repo: string | null = p.repository?.full_name ?? null;

  switch (eventName) {
    case "push": {
      const commits: any[] = Array.isArray(p.commits) ? p.commits : [];
      return commits.map((c) => ({
        type: "COMMIT" as const,
        externalId: `commit:${c.id}`,
        title: typeof c.message === "string" ? c.message.split("\n")[0]!.slice(0, 200) : null,
        state: null,
        url: c.url ?? null,
        occurredAt: parseDate(c.timestamp),
        githubLogin: c.author?.username ?? c.author?.name ?? null,
        repo,
      }));
    }
    case "pull_request": {
      const pr = p.pull_request ?? {};
      return [{
        type: "PR",
        externalId: `pr:${repo}:${pr.number}`,
        title: pr.title ?? null,
        state: p.action === "closed" && pr.merged ? "merged" : pr.state ?? p.action ?? null,
        url: pr.html_url ?? null,
        occurredAt: parseDate(pr.updated_at ?? pr.created_at),
        githubLogin: pr.user?.login ?? null,
        repo,
      }];
    }
    case "issues": {
      const issue = p.issue ?? {};
      return [{
        type: "ISSUE",
        externalId: `issue:${repo}:${issue.number}`,
        title: issue.title ?? null,
        state: issue.state ?? p.action ?? null,
        url: issue.html_url ?? null,
        occurredAt: parseDate(issue.updated_at ?? issue.created_at),
        githubLogin: issue.user?.login ?? null,
        repo,
      }];
    }
    case "pull_request_review": {
      const review = p.review ?? {};
      const pr = p.pull_request ?? {};
      return [{
        type: "REVIEW",
        externalId: `review:${review.id ?? deliveryId}`,
        title: pr.title ? `Review on: ${pr.title}` : null,
        state: review.state ?? null,
        url: review.html_url ?? null,
        occurredAt: parseDate(review.submitted_at),
        githubLogin: review.user?.login ?? null,
        repo,
      }];
    }
    default:
      return [];
  }
}

function parseDate(v: unknown): Date {
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0); // epoch sentinel — caller may override; keeps types non-null
}
