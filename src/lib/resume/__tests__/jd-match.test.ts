import { describe, expect, it } from "vitest";
import { extractKeywords, matchJobDescription, tokenize } from "../jd-match";
import { sampleResume } from "./fixtures";

const JD = `We are seeking a Data Analyst. You will use SQL and Python to build dashboards in Tableau.
Experience with SQL is required. Familiarity with Power BI and data modeling is a plus.
You will present dashboards to stakeholders. Strong SQL skills and data modeling experience preferred.`;

describe("jd-match", () => {
  it("keeps technical tokens like c++ and node.js", () => {
    expect(tokenize("C++, Node.js and CI/CD")).toEqual(["c++", "node.js", "ci/cd"]);
  });

  it("extracts repeated keywords and drops filler", () => {
    const k = extractKeywords(JD);
    expect(k).toContain("sql");
    expect(k).toContain("data modeling");
    expect(k).not.toContain("experience");
    expect(k).not.toContain("the");
  });

  it("separates matched from missing keywords", () => {
    const m = matchJobDescription(sampleResume(), JD);
    expect(m.matched).toEqual(expect.arrayContaining(["sql", "python", "tableau"]));
    expect(m.missing).toEqual(expect.arrayContaining(["power"]));
    expect(m.score).toBeGreaterThan(0);
    expect(m.score).toBeLessThan(100);
  });

  it("returns zero for an empty job description", () => {
    expect(matchJobDescription(sampleResume(), "").score).toBe(0);
  });
});
