import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

// One place for every Claude call. Reads ANTHROPIC_API_KEY from the server environment
// (set it in Vercel; never in code). ANTHROPIC_MODEL can override the default model.
export const AI_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5-5";

export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  client ??= new Anthropic({ maxRetries: 2, timeout: 120_000 });
  return client;
}

export class AiError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

type Effort = "low" | "medium" | "high";

/**
 * Ask Claude for JSON matching `schema`. Uses structured outputs so the response
 * always parses, and server-side fallbacks so a safety decline on one model is
 * retried on another inside the same call.
 */
export async function askStructured<S extends z.ZodType>(opts: {
  schema: S;
  system: string;
  user: string;
  effort?: Effort;
  maxTokens?: number;
}): Promise<z.infer<S>> {
  try {
    const response = await getClient().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: opts.maxTokens ?? 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: opts.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: opts.user }],
      output_config: { effort: opts.effort ?? "medium", format: betaZodOutputFormat(opts.schema) },
    });
    if (response.stop_reason === "refusal") throw new AiError("The AI couldn't help with this request. Please rephrase and try again.", 422);
    if (response.stop_reason === "max_tokens") throw new AiError("The AI response was too long. Try a shorter input.", 502);
    if (response.parsed_output == null) throw new AiError("The AI returned an unexpected response. Please try again.", 502);
    return response.parsed_output as z.infer<S>;
  } catch (e) {
    if (e instanceof AiError) throw e;
    if (e instanceof Anthropic.RateLimitError) throw new AiError("The AI is busy right now. Please try again in a minute.", 429);
    if (e instanceof Anthropic.AuthenticationError) throw new AiError("AI assist isn't configured correctly yet.", 503);
    if (e instanceof Anthropic.BadRequestError) throw new AiError("The AI couldn't process this input.", 400);
    if (e instanceof Anthropic.APIConnectionError) throw new AiError("Couldn't reach the AI service. Please try again.", 503);
    if (e instanceof Anthropic.APIError) throw new AiError("The AI service had a problem. Please try again.", 502);
    throw e;
  }
}
