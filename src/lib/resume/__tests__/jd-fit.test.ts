import { describe, expect, it } from "vitest";
import { analyzeFit, detectSeniority, requiredYears } from "../jd-fit";
import { addConfirmedSkill, reorderForJob } from "../tailor";
import { sampleResume } from "./fixtures";

const JD = `Junior Data Analyst
We are hiring a junior data analyst to build dashboards in Tableau and write SQL queries.
Requirements: 1+ years of experience with SQL and Excel. Bachelor's degree in Statistics or related field.
You will use SQL daily and present Tableau dashboards to stakeholders.
Preferred: experience with Looker.`;

describe("job description fit", () => {
  const now = new Date("2026-11-13");

  it("produces an explainable score from named checks", () => {
    const fit = analyzeFit(sampleResume(), JD, now);
    expect(fit.score).toBe(fit.checks.reduce((a, c) => a + c.points, 0));
    expect(fit.checks.map((c) => c.key)).toEqual(["keywords", "context", "years", "seniority", "education", "title"]);
    expect(fit.requiredYears).toBe(1);
    expect(fit.requiredEducation).toBe("Bachelor's degree");
    expect(fit.checks.find((c) => c.key === "education")!.status).toBe("ok");
    expect(fit.checks.find((c) => c.key === "title")!.status).toBe("ok");
  });

  it("prioritizes keywords and records where they were found", () => {
    const fit = analyzeFit(sampleResume(), JD, now);
    const sql = fit.keywords.find((k) => k.term === "sql")!;
    expect(sql.priority).toBe("critical");
    expect(sql.foundIn).toContain("Experience");
    const looker = fit.keywords.find((k) => k.term === "looker");
    expect(looker?.priority).toBe("nice");
    expect(looker?.foundIn).toEqual([]);
  });

  it("parses years and seniority", () => {
    expect(requiredYears("5+ years of experience; 3-5 years leading teams")).toBe(3);
    expect(requiredYears("No experience needed")).toBeNull();
    expect(detectSeniority("Senior Software Engineer")).toBe("senior");
    expect(detectSeniority("Marketing Intern")).toBe("intern");
  });

  it("flags a seniority gap", () => {
    const fit = analyzeFit(sampleResume(), "Director of Analytics\nLead a team of 20. 10+ years of experience required.", now);
    expect(fit.checks.find((c) => c.key === "seniority")!.status).not.toBe("ok");
    expect(fit.checks.find((c) => c.key === "years")!.status).toBe("gap");
  });
});

describe("deterministic tailoring", () => {
  it("reorders without adding or removing anything", () => {
    const r = sampleResume();
    r.skills = ["Statistics", "Python", "Excel", "Tableau", "SQL"];
    const t = reorderForJob(r, JD);
    expect([...t.skills].sort()).toEqual([...r.skills].sort());
    expect(t.skills.indexOf("SQL")).toBeLessThan(t.skills.indexOf("Python"));
    expect([...t.experience[0].bullets].sort()).toEqual([...r.experience[0].bullets].sort());
  });

  it("adds a confirmed skill once, needing re-confirmation", () => {
    const r = addConfirmedSkill(sampleResume(), "Looker");
    expect(r.skills).toContain("Looker");
    expect(r.skillsConfirmed).toBe(false);
    expect(addConfirmedSkill(r, "looker").skills.filter((s) => s.toLowerCase() === "looker").length).toBe(1);
  });
});
