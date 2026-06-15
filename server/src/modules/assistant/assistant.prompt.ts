/**
 * Pure prompt construction for the AI assistant — no I/O, unit-tested.
 * Keeps prompt wording in one reviewable place and bounds the input size.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface UpdateLite {
  date: Date;
  workedOn: string;
  learning: string;
  blocker: string | null;
  nextGoal: string;
}

const SUMMARY_SYSTEM =
  "You are a mentorship assistant for a university skill-building drive. " +
  "Summarize a mentee's recent progress updates into 3–4 concise bullet points covering " +
  "momentum, recurring blockers, and a suggested focus for the mentor. Be specific and constructive; do not invent facts.";

/** Build the chat messages that summarize a mentee's recent updates. */
export function buildSummaryMessages(menteeName: string, updates: UpdateLite[]): ChatMessage[] {
  const lines = updates
    .map((u) => `- ${u.date.toISOString().slice(0, 10)}: worked on ${u.workedOn}; learned ${u.learning}; blocker: ${u.blocker ?? "none"}; next: ${u.nextGoal}`)
    .join("\n");
  const user = `Mentee: ${menteeName}\nRecent updates (newest first):\n${lines || "(no updates)"}`;
  return [
    { role: "system", content: SUMMARY_SYSTEM },
    { role: "user", content: user },
  ];
}

/** Hard cap on free-form prompt length sent to the model (defence-in-depth with the Zod limit). */
export function clampPrompt(prompt: string, max = 4000): string {
  return prompt.length > max ? prompt.slice(0, max) : prompt;
}
