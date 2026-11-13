import "server-only";
import { NextResponse } from "next/server";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { aiConfigured, AiError } from "./client";

// Daily AI allowance per user (protects the budget). Override with AI_DAILY_LIMIT.
const DAILY_LIMIT = Number(process.env.AI_DAILY_LIMIT) || 80;

/** Check sign-in, configuration and the daily allowance, then record usage. */
export async function guardAi(feature: string, units = 1): Promise<NextResponse | { userId: string }> {
  if (!aiConfigured()) {
    return NextResponse.json({ error: "AI assist isn't switched on yet.", code: "ai_not_configured" }, { status: 503 });
  }
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

  const supabase = await createClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase.from("ai_usage").select("units").gte("created_at", since);
  if (error) return NextResponse.json({ error: "Couldn't check your AI allowance." }, { status: 500 });
  const used = (data ?? []).reduce((a: number, r: { units: number }) => a + r.units, 0);
  if (used + units > DAILY_LIMIT) {
    return NextResponse.json({ error: "You've reached today's AI limit. It resets within 24 hours.", code: "ai_limit" }, { status: 429 });
  }
  await supabase.from("ai_usage").insert({ feature, units });
  return { userId: user.id };
}

export function aiErrorResponse(e: unknown): NextResponse {
  if (e instanceof AiError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error("AI route error", e);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Parse and validate a JSON body; returns null on failure. */
export async function readJson<T>(request: Request, parse: (v: unknown) => T | null): Promise<T | null> {
  const body = await request.json().catch(() => null);
  return body == null ? null : parse(body);
}
