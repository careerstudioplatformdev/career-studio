import "server-only";
import { sanitizeVariant, type SanitizedVariant } from "@/lib/resume/variants";
import type { ResumeContent } from "@/lib/resume/types";
import { askStructured } from "./client";
import { resumeForPrompt } from "./inputs";
import { APPROVER_SYSTEM, builderSystem, reviewerSystem } from "./prompts";
import { approvalSchema, reviewSchema, variantSchema, type ReviewOutput, type Variant } from "./schemas";

export type AgentRun = {
  versions: { key: "A" | "B" | "C" | "final"; label: string; variant: SanitizedVariant; scores: Record<string, number> }[];
  reviews: { agent: string; output: ReviewOutput }[];
  recommended: "A" | "B" | "C";
  rationale: string;
};

const LABELS = { A: "Recruiter-focused", B: "ATS-focused", C: "Achievement-focused" } as const;
const REVIEWERS = { ats: "ATS & keywords", recruiter: "Recruiter readability", accuracy: "Factual accuracy" } as const;

function sourceBlock(r: ResumeContent, story: string, jd: string): string {
  return [
    `CANDIDATE SOURCE MATERIAL (the only allowed facts):\n<story>\n${story || "(none)"}\n</story>`,
    `<resume>\n${resumeForPrompt(r)}\n</resume>`,
    jd ? `<job_description>\n${jd}\n</job_description>` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * Seven agents: three builders write versions in parallel, three reviewers score all
 * versions in parallel, and a final approver picks and polishes the best one.
 * Every version is sanitized afterwards, so unsupported numbers never reach the user.
 */
export async function runSevenAgents(r: ResumeContent, story: string, jd: string): Promise<AgentRun> {
  const src = sourceBlock(r, story, jd);

  const keys = ["A", "B", "C"] as const;
  const builds = await Promise.all(
    keys.map((k) =>
      askStructured({ schema: variantSchema, system: builderSystem(k, r.pageTarget), user: `${src}\n\nWrite your version now.` }),
    ),
  );
  const clean = (v: Variant) => sanitizeVariant(v, r, [story]);
  const variants = Object.fromEntries(keys.map((k, i) => [k, clean(builds[i])])) as Record<"A" | "B" | "C", SanitizedVariant>;

  const versionsBlock = keys.map((k) => `<version id="${k}" approach="${LABELS[k]}">\n${JSON.stringify(variants[k])}\n</version>`).join("\n");
  const reviewerKeys = ["ats", "recruiter", "accuracy"] as const;
  const reviews = await Promise.all(
    reviewerKeys.map((k) =>
      askStructured({ schema: reviewSchema, system: reviewerSystem(k), user: `${src}\n\n${versionsBlock}\n\nReview all three versions.`, effort: "low" }),
    ),
  );

  const reviewBlock = reviewerKeys.map((k, i) => `<review agent="${REVIEWERS[k]}">\n${JSON.stringify(reviews[i])}\n</review>`).join("\n");
  const approval = await askStructured({
    schema: approvalSchema,
    system: APPROVER_SYSTEM,
    user: `${src}\n\n${versionsBlock}\n\n${reviewBlock}\n\nDecide and write the final version.`,
  });

  const scoreFor = (k: "A" | "B" | "C") =>
    Object.fromEntries(reviewerKeys.map((rk, i) => [REVIEWERS[rk], Math.round(reviews[i].reviews.find((x) => x.variant === k)?.score ?? 0)]));

  return {
    versions: [
      { key: "final", label: "Recommended (final approval)", variant: clean(approval.final), scores: {} },
      ...keys.map((k) => ({ key: k, label: LABELS[k], variant: variants[k], scores: scoreFor(k) })),
    ],
    reviews: reviewerKeys.map((k, i) => ({ agent: REVIEWERS[k], output: reviews[i] })),
    recommended: approval.recommended,
    rationale: approval.rationale,
  };
}
