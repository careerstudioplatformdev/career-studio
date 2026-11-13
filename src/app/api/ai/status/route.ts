import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/ai/client";

export const runtime = "nodejs";

/** Lets the UI know whether AI assist is switched on, so it can offer the guided form instead. */
export async function GET() {
  return NextResponse.json({ enabled: aiConfigured() });
}
