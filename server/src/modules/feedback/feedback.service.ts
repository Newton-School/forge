import { Errors } from "../../lib/errors.js";
import { audit } from "../../lib/audit.js";
import { effectiveScope } from "../../rbac/policy.js";
import type { AuthContext } from "../../rbac/types.js";
import { feedbackRepo } from "./feedback.repository.js";
import type { ListMentorFeedbackQuery, SubmitMentorFeedbackInput } from "./feedback.schema.js";

/**
 * Read scope for 360° feedback (subject = the mentor):
 *  - domain roles see feedback about mentors in their domain,
 *  - a mentor sees feedback about themselves,
 *  - a mentee sees the feedback they submitted.
 */
async function feedbackScope(ctx: AuthContext): Promise<Record<string, unknown>> {
  const s = effectiveScope(ctx);
  if (s.global) return {};
  const or: Record<string, unknown>[] = [];
  if (s.domainIds.length) {
    const mentorIds = await feedbackRepo.mentorIdsInDomains(s.domainIds);
    if (mentorIds.length) or.push({ mentorId: { in: mentorIds } });
  }
  if (s.teamIds.length) or.push({ mentorId: ctx.id }); // a mentor sees their own 360°
  if (s.self) or.push({ menteeId: ctx.id }); // a mentee sees what they submitted
  return or.length ? (or.length === 1 ? or[0]! : { OR: or }) : { id: "__never__" };
}

export async function submitMentorFeedback(ctx: AuthContext, input: SubmitMentorFeedbackInput, ip?: string) {
  // A mentee may only rate a mentor who actually mentors one of their teams.
  if (!(await feedbackRepo.isMentorOfMentee(input.mentorId, ctx.id))) {
    throw Errors.forbidden("You can only rate a mentor who mentors your team");
  }
  const row = await feedbackRepo.create(ctx.id, input);
  // Audit the action but not the (confidential) answers — only that it happened.
  await audit(ctx, {
    action: "mentorFeedback:submit", entityType: "MentorFeedback", entityId: row.id,
    after: { mentorId: input.mentorId }, ip,
  });
  return row;
}

export async function listMentorFeedback(ctx: AuthContext, q: ListMentorFeedbackQuery) {
  // AND the ?mentorId filter WITH the scope — spreading it would overwrite a mentor's own-feedback
  // scope `{ mentorId: ctx.id }` and leak another mentor's 360°. AND can only narrow within scope.
  const where = { AND: [await feedbackScope(ctx), ...(q.mentorId ? [{ mentorId: q.mentorId }] : [])] };
  const items = await feedbackRepo.list(where, q.take, q.skip);
  return { items };
}
