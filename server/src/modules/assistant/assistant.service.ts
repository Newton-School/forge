import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { scopeWhere } from "../../rbac/scope.js";
import type { AuthContext } from "../../rbac/types.js";
import { assistantRepo } from "./assistant.repository.js";
import { groqChat } from "./assistant.client.js";
import { buildSummaryMessages, clampPrompt } from "./assistant.prompt.js";

const ASSISTANT_SYSTEM =
  "You are a concise assistant for a university skill-building drive (mentees, mentors, teachers). " +
  "Answer helpfully and briefly. You have no access to private data beyond what the user provides.";

/** Free-form question to the assistant (general help; no private data access). */
export async function ask(ctx: AuthContext, prompt: string, ip?: string) {
  const result = await groqChat([
    { role: "system", content: ASSISTANT_SYSTEM },
    { role: "user", content: clampPrompt(prompt) },
  ]);
  await audit(ctx, { action: "assistant:ask", entityType: "Assistant", after: { tokens: result.usage?.total_tokens ?? null }, ip });
  return { text: result.text };
}

/**
 * Summarize a mentee's recent updates. The updates are loaded through the caller's
 * scope filter, so a mentor/teacher only summarizes mentees they may actually see.
 */
export async function summarizeMentee(ctx: AuthContext, menteeId: string, ip?: string) {
  const where = scopeWhere(ctx, { teamField: "teamId", ownerField: "userId" });
  const updates = await assistantRepo.updatesInScope(where, menteeId, 12);
  if (updates.length === 0) throw Errors.badRequest("No visible updates for that mentee");

  const name = (await assistantRepo.menteeName(menteeId)) ?? "the mentee";
  const result = await groqChat(buildSummaryMessages(name, updates), { temperature: 0.3 });
  await audit(ctx, { action: "assistant:summarize", entityType: "MenteeUpdate", entityId: menteeId, after: { updates: updates.length, tokens: result.usage?.total_tokens ?? null }, ip });
  return { summary: result.text, updatesConsidered: updates.length };
}
