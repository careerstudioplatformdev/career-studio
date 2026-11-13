import { describe, expect, it } from "vitest";
import { approvalChecklist, outcomeInsights, type Application } from "../../applications";
import { newExperience } from "../factory";
import { resumeQuestions } from "../interview";
import { sampleResume } from "./fixtures";

describe("resume-based interview questions", () => {
  it("asks about the user's own bullets and skills", () => {
    const qs = resumeQuestions(sampleResume());
    expect(qs[0].kind).toBe("screening");
    expect(qs.some((q) => q.kind === "resume" && q.question.includes("Built 3 Excel dashboards"))).toBe(true);
    expect(qs.some((q) => q.kind === "technical" && q.question.includes("SQL"))).toBe(true);
    expect(new Set(qs.map((q) => q.id)).size).toBe(qs.length);
  });

  it("asks about a gap when the timeline has one", () => {
    const r = sampleResume();
    const later = newExperience();
    Object.assign(later, { title: "Analyst", organization: "Beta", startDate: "2026-06", current: true, bullets: ["Built reports"] });
    r.experience.push(later);
    expect(resumeQuestions(r, 30).some((q) => q.kind === "gap")).toBe(true);
  });
});

const app = (p: Partial<Application>): Application => ({
  id: "a",
  resume_id: "r",
  company: "",
  job_title: "",
  job_url: "https://example.com/job",
  description: "",
  status: "saved",
  match_score: 70,
  cover_letter: "",
  notes: "",
  approved_at: null,
  applied_at: null,
  created_at: "",
  updated_at: "",
  ...p,
});

describe("applications", () => {
  it("requires an approved resume and a posting link before approval", () => {
    expect(approvalChecklist(app({}), { status: "approved" }).every((c) => c.ok)).toBe(true);
    expect(approvalChecklist(app({}), { status: "draft" }).every((c) => c.ok)).toBe(false);
    expect(approvalChecklist(app({ job_url: "javascript:alert(1)" }), { status: "approved" }).every((c) => c.ok)).toBe(false);
  });

  it("finds patterns once enough outcomes exist", () => {
    expect(outcomeInsights([app({ status: "rejected" })])).toEqual([]);
    const insights = outcomeInsights([
      app({ status: "interviewing", match_score: 85 }),
      app({ status: "offer", match_score: 80 }),
      app({ status: "rejected", match_score: 55 }),
      app({ status: "rejected", match_score: 60 }),
    ]);
    expect(insights.join(" ")).toMatch(/averaged a 83 match score vs 58/);
    expect(insights.join(" ")).toMatch(/50% of your decided applications/);
  });
});
