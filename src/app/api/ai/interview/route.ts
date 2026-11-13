import { NextResponse } from "next/server";
import { askStructured } from "@/lib/ai/client";
import { aiErrorResponse, guardAi, readJson } from "@/lib/ai/guard";
import { interviewInput, resumeForPrompt, safeParse } from "@/lib/ai/inputs";
import { INTERVIEW_FEEDBACK_SYSTEM, INTERVIEW_QUESTIONS_SYSTEM } from "@/lib/ai/prompts";
import { interviewFeedbackSchema, interviewQuestionsSchema } from "@/lib/ai/schemas";

export const runtime = "nodejs";
export const maxDuration = 120;

// Resume-based interview prep: generate questions, or give feedback on a practice answer.
export async function POST(request: Request) {
  const input = await readJson(request, safeParse(interviewInput));
  if (!input) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const guard = await guardAi(`interview_${input.mode}`);
  if (guard instanceof NextResponse) return guard;
  try {
    const resume = `<resume>\n${resumeForPrompt(input.resume)}\n</resume>`;
    if (input.mode === "questions") {
      const jd = input.jobDescription ? `\n\n<job_description>\n${input.jobDescription}\n</job_description>` : "";
      return NextResponse.json(
        await askStructured({ schema: interviewQuestionsSchema, system: INTERVIEW_QUESTIONS_SYSTEM, user: `${resume}${jd}\n\nWrite 10 questions.`, effort: "low" }),
      );
    }
    return NextResponse.json(
      await askStructured({
        schema: interviewFeedbackSchema,
        system: INTERVIEW_FEEDBACK_SYSTEM,
        user: `${resume}\n\n<question>${input.question}</question>\n\n<answer>\n${input.answer}\n</answer>`,
        effort: "low",
      }),
    );
  } catch (e) {
    return aiErrorResponse(e);
  }
}
