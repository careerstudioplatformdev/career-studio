import { NextResponse } from "next/server";
import { askStructured } from "@/lib/ai/client";
import { aiErrorResponse, guardAi, readJson } from "@/lib/ai/guard";
import { coachInput, resumeForPrompt, safeParse } from "@/lib/ai/inputs";
import { COACH_SYSTEM } from "@/lib/ai/prompts";
import { coachSchema } from "@/lib/ai/schemas";
import { resumeText } from "@/lib/resume/facts";
import { mergeDraft } from "@/lib/resume/merge";

export const runtime = "nodejs";
export const maxDuration = 120;

// Conversational resume coach: turns the user's story and answers into resume facts,
// then asks the next single question.
export async function POST(request: Request) {
  const input = await readJson(request, safeParse(coachInput));
  if (!input) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  if (!input.story.trim() && input.chat.length === 0) return NextResponse.json({ error: "Tell us a little about yourself first." }, { status: 400 });

  const guard = await guardAi("coach");
  if (guard instanceof NextResponse) return guard;

  try {
    const transcript = input.chat.map((t) => `${t.role === "coach" ? "Coach" : "Candidate"}: ${t.text}`).join("\n");
    const out = await askStructured({
      schema: coachSchema,
      system: COACH_SYSTEM,
      user: `<story>\n${input.story || "(not given)"}\n</story>\n\n<conversation>\n${transcript || "(just started)"}\n</conversation>\n\n<current_resume>\n${resumeForPrompt(input.resume)}\n</current_resume>\n\nQuestions asked so far: ${input.chat.filter((t) => t.role === "coach").length}. Return the patch and the next question.`,
    });
    // Only the user's own words count as sources for grounding.
    const sources = [input.story, ...input.chat.filter((t) => t.role === "user").map((t) => t.text), resumeText(input.resume)];
    const { resume, report } = mergeDraft(input.resume, out.patch, sources);
    return NextResponse.json({
      resume,
      report,
      nextQuestion: out.readyToReview ? "" : out.nextQuestion,
      whyAsking: out.whyAsking,
      readyToReview: out.readyToReview,
    });
  } catch (e) {
    return aiErrorResponse(e);
  }
}
