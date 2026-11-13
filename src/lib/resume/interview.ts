// Resume-based interview questions. Interviewers ask about what's on the page,
// so we generate questions straight from the user's own bullets, skills and gaps.

import { findRedFlags } from "./quality";
import type { ResumeContent } from "./types";

export type InterviewKind = "behavioral" | "technical" | "resume" | "screening" | "gap";

export type InterviewQuestion = {
  id: string;
  kind: InterviewKind;
  question: string;
  /** Which part of the resume prompted it. */
  basedOn: string;
  /** What a strong answer covers. */
  tips: string[];
};

const STAR = ["Situation: set the scene in one sentence.", "Task: what you were responsible for.", "Action: what you did, step by step.", "Result: what changed, with a number if you have one."];

export function resumeQuestions(r: ResumeContent, limit = 12): InterviewQuestion[] {
  const qs: InterviewQuestion[] = [];
  const role = r.targetRole.trim() || "this role";

  qs.push({
    id: "intro",
    kind: "screening",
    question: `Walk me through your background and why you're interested in ${role}.`,
    basedOn: "Your summary and target role",
    tips: ["Two minutes: past → present → why this role.", "Connect your most relevant experience to the job.", "End with what you want to do next."],
  });

  const work = r.experience.filter((e) => e.bullets.some((b) => b.trim()));
  for (const e of work.slice(0, 3)) {
    const name = [e.title, e.organization].filter(Boolean).join(" at ");
    const best = e.bullets.find((b) => /\d/.test(b)) ?? e.bullets.find((b) => b.trim())!;
    qs.push({
      id: `exp-${e.id}`,
      kind: "resume",
      question: `Your resume says: "${best.trim()}". Tell me more. What was your specific role, and how did you get that result?`,
      basedOn: name,
      tips: [...STAR, /\d/.test(best) ? "Be ready to explain how you measured the number." : "If you can, give a sense of scale (how many, how often)."],
    });
    if (/\b(led|lead|managed|supervis|trained|mentor|coordinat)/i.test(e.bullets.join(" "))) {
      qs.push({
        id: `lead-${e.id}`,
        kind: "behavioral",
        question: `At ${e.organization || "that job"}, tell me about a time you had to get others aligned or handle a disagreement.`,
        basedOn: name,
        tips: STAR,
      });
    }
  }

  for (const p of r.projects.slice(0, 2)) {
    qs.push({
      id: `proj-${p.id}`,
      kind: "resume",
      question: `What was the hardest problem in "${p.name}", and how did you solve it?`,
      basedOn: p.name,
      tips: ["Explain the problem plainly.", "Describe options you considered and why you chose one.", "Share what you'd do differently now."],
    });
  }

  for (const s of r.skills.slice(0, 3)) {
    qs.push({
      id: `skill-${s}`,
      kind: "technical",
      question: `How have you used ${s} in practice? Give a specific example.`,
      basedOn: `Skills: ${s}`,
      tips: ["Name the task, the tool and the outcome.", "Be honest about your level; describe how you'd learn what you don't know."],
    });
  }

  for (const f of findRedFlags(r).filter((f) => /gap/.test(f.message)).slice(0, 1)) {
    qs.push({
      id: "gap",
      kind: "gap",
      question: "I see a gap in your work history. What were you doing during that time?",
      basedOn: f.message,
      tips: ["Keep it brief and honest; you don't have to share private details.", "Mention anything you learned or did (courses, caregiving, projects).", "Pivot to why you're ready now."],
    });
  }

  qs.push(
    {
      id: "challenge",
      kind: "behavioral",
      question: "Tell me about a time something went wrong at work or school. What did you do?",
      basedOn: "Common behavioral question",
      tips: STAR,
    },
    {
      id: "why",
      kind: "screening",
      question: `Why should we hire you for ${role}?`,
      basedOn: "Your strongest bullets",
      tips: ["Pick your top three strengths that match the job.", "Back each with one example from your resume."],
    },
  );

  return qs.slice(0, limit);
}
