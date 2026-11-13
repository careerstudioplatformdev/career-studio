import { NextResponse } from "next/server";
import { askStructured } from "@/lib/ai/client";
import { aiErrorResponse, guardAi, readJson } from "@/lib/ai/guard";
import { resumeForPrompt, safeParse, tailorInput } from "@/lib/ai/inputs";
import { TAILOR_SYSTEM } from "@/lib/ai/prompts";
import { tailorSchema } from "@/lib/ai/schemas";
import { resumeText } from "@/lib/resume/facts";
import { unsupportedNumbers } from "@/lib/resume/impact";

export const runtime = "nodejs";
export const maxDuration = 180;

// Job-specific tailoring suggestions (and optional cover letter), grounded in the resume.
export async function POST(request: Request) {
  const input = await readJson(request, safeParse(tailorInput));
  if (!input) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const guard = await guardAi("tailor", input.includeCoverLetter ? 2 : 1);
  if (guard instanceof NextResponse) return guard;
  try {
    const out = await askStructured({
      schema: tailorSchema,
      system: TAILOR_SYSTEM,
      user: `<story>\n${input.story || "(none)"}\n</story>\n\n<resume>\n${resumeForPrompt(input.resume)}\n</resume>\n\n<job_description>\n${input.jobDescription}\n</job_description>\n\nCover letter requested: ${input.includeCoverLetter ? "yes" : "no"}.`,
    });
    const sources = [resumeText(input.resume), input.story];
    const allBullets = new Map([...input.resume.experience, ...input.resume.projects].flatMap((e) => e.bullets.map((b) => [b.trim(), e.id] as const)));
    const removed: string[] = [];
    const ok = (t: string) => {
      const bad = unsupportedNumbers(t, sources);
      if (bad.length) removed.push(`"${t.slice(0, 80)}…" (unsupported: ${bad.join(", ")})`);
      return bad.length === 0;
    };
    return NextResponse.json({
      summary: ok(out.summary) ? out.summary : "",
      // Only suggestions for bullets that really exist, without invented numbers.
      bulletSuggestions: out.bulletSuggestions.filter((s) => allBullets.get(s.original.trim()) === s.entryId && ok(s.suggested)),
      keywordsToConfirm: out.keywordsToConfirm,
      coverLetter: input.includeCoverLetter && ok(out.coverLetter) ? out.coverLetter : "",
      removed,
    });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
