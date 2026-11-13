import { describe, expect, it } from "vitest";
import { fScan, leftEdge } from "../fscan";
import { buildLayout } from "../layout";
import { sampleResume } from "./fixtures";

describe("Recruiter Gaze F-Scan", () => {
  it("rewards a summary that names the target role and strong bullet openings", () => {
    const r = sampleResume();
    r.summary = "Junior data analyst with internship experience building Excel dashboards and SQL pipelines.";
    const good = fScan(buildLayout(r), r.targetRole, ["sql", "excel"]);
    r.summary = "";
    r.experience[0].bullets = ["Responsible for dashboards", "Helped with records"];
    const weak = fScan(buildLayout(r), r.targetRole, ["sql", "excel"]);
    expect(good.score).toBeGreaterThan(weak.score);
    expect(weak.zones.find((z) => z.key === "top")!.findings.some((f) => !f.ok)).toBe(true);
    expect(weak.zones.find((z) => z.key === "leftEdge")!.findings.some((f) => /start weakly/.test(f.text))).toBe(true);
  });

  it("caps the score at 100", () => {
    const r = sampleResume();
    r.summary = "Junior Data Analyst skilled in SQL and Excel.";
    expect(fScan(buildLayout(r), r.targetRole).score).toBeLessThanOrEqual(100);
  });

  it("reads the first words of a bullet", () => {
    expect(leftEdge("Built 3 Excel dashboards for sales")).toBe("Built 3 Excel");
  });
});
