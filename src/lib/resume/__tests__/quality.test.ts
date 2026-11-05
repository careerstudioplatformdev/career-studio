import { describe, expect, it } from "vitest";
import { newExperience } from "../factory";
import { findRedFlags, scoreResume, startsWithActionVerb } from "../quality";
import { sampleResume } from "./fixtures";

const NOW = new Date("2026-11-05T12:00:00Z");

describe("scoreResume", () => {
  it("scores within 0..100 and explains every category", () => {
    const report = scoreResume(sampleResume(), NOW);
    expect(report.max).toBe(100);
    expect(report.score).toBeGreaterThan(50);
    expect(report.score).toBeLessThanOrEqual(100);
    for (const c of report.categories) {
      expect(c.checks.length).toBeGreaterThan(0);
      expect(c.points).toBeLessThanOrEqual(c.max);
    }
  });

  it("gives an empty resume a low score", () => {
    const r = sampleResume();
    r.contact.fullName = "";
    r.contact.email = "";
    r.experience = [];
    r.education = [];
    r.skills = [];
    expect(scoreResume(r, NOW).score).toBeLessThan(25);
  });

  it("recognizes action verbs", () => {
    expect(startsWithActionVerb("Built a dashboard")).toBe(true);
    expect(startsWithActionVerb("Responsible for things")).toBe(false);
  });
});

describe("findRedFlags", () => {
  it("flags end dates before start dates", () => {
    const r = sampleResume();
    r.experience[0].startDate = "2025-08";
    r.experience[0].endDate = "2025-06";
    const flags = findRedFlags(r, NOW);
    expect(flags.some((f) => f.severity === "high" && f.message.includes("ends before it starts"))).toBe(true);
  });

  it("flags future dates", () => {
    const r = sampleResume();
    r.experience[0].endDate = "2027-01";
    expect(findRedFlags(r, NOW).some((f) => f.message.includes("future"))).toBe(true);
  });

  it("flags gaps over six months between jobs", () => {
    const r = sampleResume();
    const later = newExperience();
    Object.assign(later, { title: "Analyst", organization: "Beta", startDate: "2026-06", current: true });
    r.experience.push(later);
    expect(findRedFlags(r, NOW).some((f) => f.message.includes("gap"))).toBe(true);
  });

  it("does not flag gaps around volunteer work", () => {
    const r = sampleResume();
    const vol = newExperience("typed", "volunteer");
    Object.assign(vol, { title: "Tutor", organization: "Library", startDate: "2019-01", endDate: "2019-03" });
    r.experience.push(vol);
    expect(findRedFlags(r, NOW).some((f) => f.message.includes("gap"))).toBe(false);
  });

  it("has no flags for a clean resume", () => {
    expect(findRedFlags(sampleResume(), NOW)).toEqual([]);
  });
});
