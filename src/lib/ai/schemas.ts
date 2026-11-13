import { z } from "zod";

// Output schemas for structured outputs. Every field is required (use "" or [] for
// unknown) so the model can't silently skip the honesty-relevant ones.

const draftExperience = z.object({
  kind: z.enum(["job", "internship", "volunteer", "freelance"]),
  title: z.string(),
  organization: z.string(),
  location: z.string(),
  startDate: z.string().describe('"YYYY-MM", "YYYY", or "" if the user did not say'),
  endDate: z.string().describe('"YYYY-MM", "YYYY", or "" if unknown or current'),
  current: z.boolean(),
  bullets: z.array(z.string()),
});

export const draftPatchSchema = z.object({
  targetRole: z.string(),
  contact: z.object({ fullName: z.string(), email: z.string(), phone: z.string(), location: z.string(), links: z.array(z.string()) }),
  summary: z.string(),
  experience: z.array(draftExperience),
  education: z.array(
    z.object({ school: z.string(), credential: z.string(), field: z.string(), startDate: z.string(), endDate: z.string(), current: z.boolean(), details: z.array(z.string()) }),
  ),
  projects: z.array(z.object({ name: z.string(), role: z.string(), link: z.string(), bullets: z.array(z.string()) })),
  certifications: z.array(z.object({ name: z.string(), issuer: z.string(), date: z.string() })),
  skills: z.array(z.string()),
});

export const coachSchema = z.object({
  patch: draftPatchSchema,
  nextQuestion: z.string().describe("Exactly one question for the user, or empty when readyToReview is true"),
  whyAsking: z.string().describe("One short sentence on why this question helps their resume"),
  readyToReview: z.boolean(),
});

export const variantSchema = z.object({
  summary: z.string(),
  entries: z.array(z.object({ id: z.string(), bullets: z.array(z.string()) })),
  skills: z.array(z.string()).describe("The user's existing skills, reordered by relevance; never add new ones"),
  notes: z.string().describe("One or two sentences on this version's approach"),
});

export const reviewSchema = z.object({
  reviews: z.array(
    z.object({
      variant: z.enum(["A", "B", "C"]),
      score: z.number().describe("0-100"),
      strengths: z.array(z.string()),
      issues: z.array(z.string()),
    }),
  ),
});

export const approvalSchema = z.object({
  recommended: z.enum(["A", "B", "C"]),
  rationale: z.string(),
  final: variantSchema,
});

export const interviewQuestionsSchema = z.object({
  questions: z.array(
    z.object({
      kind: z.enum(["behavioral", "technical", "resume", "screening", "gap"]),
      question: z.string(),
      basedOn: z.string(),
      tips: z.array(z.string()),
    }),
  ),
});

export const interviewFeedbackSchema = z.object({
  scores: z.object({
    relevance: z.number().describe("1-5"),
    structure: z.number().describe("1-5, STAR structure"),
    specificity: z.number().describe("1-5, concrete details and results"),
    communication: z.number().describe("1-5, clarity and concision"),
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  strongerAnswer: z.string().describe("An improved outline using only the user's facts; [brackets] for anything they must fill in"),
  followUp: z.string().describe("A follow-up question an interviewer might ask next"),
});

export const tailorSchema = z.object({
  summary: z.string(),
  bulletSuggestions: z.array(z.object({ entryId: z.string(), original: z.string(), suggested: z.string(), keywordsUsed: z.array(z.string()) })),
  keywordsToConfirm: z.array(z.object({ term: z.string(), question: z.string() })),
  coverLetter: z.string(),
});

export type CoachOutput = z.infer<typeof coachSchema>;
export type Variant = z.infer<typeof variantSchema>;
export type ReviewOutput = z.infer<typeof reviewSchema>;
export type ApprovalOutput = z.infer<typeof approvalSchema>;
export type InterviewFeedback = z.infer<typeof interviewFeedbackSchema>;
export type TailorOutput = z.infer<typeof tailorSchema>;
