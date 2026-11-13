import { z } from "zod";
import { normalizeResume } from "@/lib/resume/factory";
import type { ResumeContent } from "@/lib/resume/types";

// Request body validation for the AI routes, with size caps to keep costs bounded.

const resume = z.record(z.string(), z.unknown()).transform((v) => normalizeResume(v as Partial<ResumeContent>));
const turn = z.object({ role: z.enum(["coach", "user"]), text: z.string().max(4000) });

export const coachInput = z.object({
  resume,
  story: z.string().max(12000),
  chat: z.array(turn).max(80),
});

export const agentsInput = z.object({
  resume,
  story: z.string().max(12000).default(""),
  jobDescription: z.string().max(15000).default(""),
});

export const interviewInput = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("questions"), resume, jobDescription: z.string().max(15000).default("") }),
  z.object({ mode: z.literal("feedback"), resume, question: z.string().min(5).max(1000), answer: z.string().min(10).max(6000) }),
]);

export const tailorInput = z.object({
  resume,
  jobDescription: z.string().min(40).max(15000),
  story: z.string().max(12000).default(""),
  includeCoverLetter: z.boolean().default(false),
});

export function safeParse<T extends z.ZodType>(schema: T) {
  return (v: unknown): z.infer<T> | null => {
    const r = schema.safeParse(v);
    return r.success ? r.data : null;
  };
}

/** Compact resume JSON for prompts: drops bookkeeping fields the model doesn't need. */
export function resumeForPrompt(r: ResumeContent): string {
  const strip = (x: object) =>
    Object.fromEntries(Object.entries(x).filter(([k]) => k !== "source" && k !== "confirmed" && k !== "confidence"));
  return JSON.stringify({
    targetRole: r.targetRole,
    contact: { fullName: r.contact.fullName, email: r.contact.email, phone: r.contact.phone, location: r.contact.location, links: r.contact.links },
    summary: r.summary,
    experience: r.experience.map(strip),
    education: r.education.map(strip),
    projects: r.projects.map(strip),
    certifications: r.certifications.map(strip),
    skills: r.skills,
    pageTarget: r.pageTarget,
  });
}
