import { NextResponse } from "next/server";
import { runSevenAgents } from "@/lib/ai/agents";
import { aiErrorResponse, guardAi, readJson } from "@/lib/ai/guard";
import { agentsInput, safeParse } from "@/lib/ai/inputs";

export const runtime = "nodejs";
export const maxDuration = 300;

// Seven-agent review: 3 builders, 3 reviewers, 1 final approver.
export async function POST(request: Request) {
  const input = await readJson(request, safeParse(agentsInput));
  if (!input) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const r = input.resume;
  if (r.experience.length + r.projects.length === 0) {
    return NextResponse.json({ error: "Add at least one job, internship or project with bullets first." }, { status: 400 });
  }
  const guard = await guardAi("seven_agents", 7);
  if (guard instanceof NextResponse) return guard;
  try {
    return NextResponse.json(await runSevenAgents(r, input.story, input.jobDescription));
  } catch (e) {
    return aiErrorResponse(e);
  }
}
