import crypto from "node:crypto";
import { env, googleCalendarConfigured } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

export interface CalendarEventData {
  title: string;
  startsAt: Date;
  endsAt?: Date | null;
  attendees?: string[];
}

/** Outbound calendar port (Adapter). The service depends only on this interface. */
export interface CalendarProvider {
  readonly name: string;
  /** Push an event to the external calendar; returns its external id (or null when local-only). */
  createEvent(e: CalendarEventData): Promise<{ externalId: string | null }>;
}

/** Default: store locally only, no external push. */
class LocalCalendarProvider implements CalendarProvider {
  readonly name = "local";
  async createEvent(): Promise<{ externalId: string | null }> {
    return { externalId: null };
  }
}

const base64url = (b: Buffer) => b.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

/**
 * Google Calendar via a service account. Signs a JWT (RS256) with the SA private key,
 * exchanges it for an access token, then inserts the event. Dependency-free (fetch +
 * node:crypto). Failures propagate to the service, which treats the push as best-effort.
 */
class GoogleCalendarProvider implements CalendarProvider {
  readonly name = "google";

  private async accessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const claims = base64url(Buffer.from(JSON.stringify({
      iss: env.GOOGLE_SA_CLIENT_EMAIL,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })));
    const signingInput = `${header}.${claims}`;
    const key = (env.GOOGLE_SA_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
    const signature = base64url(crypto.sign("RSA-SHA256", Buffer.from(signingInput), key));
    const assertion = `${signingInput}.${signature}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    });
    if (!res.ok) throw new Error(`Google token exchange failed: ${res.status}`);
    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) throw new Error("Google token response missing access_token");
    return json.access_token;
  }

  async createEvent(e: CalendarEventData): Promise<{ externalId: string | null }> {
    const token = await this.accessToken();
    const calId = encodeURIComponent(env.GOOGLE_CALENDAR_ID!);
    const body = {
      summary: e.title,
      start: { dateTime: e.startsAt.toISOString() },
      end: { dateTime: (e.endsAt ?? new Date(e.startsAt.getTime() + 3600_000)).toISOString() },
      attendees: e.attendees?.map((email) => ({ email })),
    };
    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calId}/events`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Google event insert failed: ${res.status}`);
    const json = (await res.json()) as { id?: string };
    return { externalId: json.id ?? null };
  }
}

let cached: CalendarProvider | null = null;

export function calendarProvider(): CalendarProvider {
  if (!cached) {
    cached = googleCalendarConfigured ? new GoogleCalendarProvider() : new LocalCalendarProvider();
    logger.info({ provider: cached.name }, "calendar provider selected");
  }
  return cached;
}
