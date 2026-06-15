import { env, groqConfigured } from "../../config/env.js";
import { Errors } from "../../lib/errors.js";
import { logger } from "../../lib/logger.js";
import type { ChatMessage } from "./assistant.prompt.js";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_TOKENS = 512; // hard cap on completion size (cost guard)

export interface ChatResult {
  text: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

/**
 * Outbound Groq chat completion (OpenAI-compatible). Fails fast with a clean error
 * when unconfigured, and never leaks the upstream error body to the caller.
 */
export async function groqChat(messages: ChatMessage[], opts: { temperature?: number } = {}): Promise<ChatResult> {
  if (!groqConfigured) throw Errors.badRequest("AI assistant is not configured");
  let res: Response;
  try {
    res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${env.GROQ_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ model: env.GROQ_MODEL, messages, max_tokens: MAX_TOKENS, temperature: opts.temperature ?? 0.4 }),
    });
  } catch (err) {
    logger.error({ err }, "groq request failed (network)");
    throw Errors.badRequest("AI request failed");
  }
  if (!res.ok) {
    logger.error({ status: res.status }, "groq request failed (status)");
    throw Errors.badRequest("AI request failed");
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: ChatResult["usage"] };
  return { text: json.choices?.[0]?.message?.content ?? "", usage: json.usage };
}
