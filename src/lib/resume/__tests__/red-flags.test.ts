import { describe, expect, it } from "vitest";
import { newExperience } from "../factory";
import { scoreResume } from "../quality";
import { findContentFlags } from "../red-flags";
import { sampleResume } from "./fixtures";

describe("content red flags", () => {
  it("finds nothing serious in a clean resume", () => {
    expect(findContentFlags(sampleResume()).filter((f) => f.severity !== "low")).toEqual([]);
  });

  it("flags vague duty bullets, missing results and clichés", () => {
    const r = sampleResume();
    r.experience[0].bullets = ["Responsible for answering phones", "Worked on filing", "Hard worker and team player"];
    const msgs = findContentFlags(r).map((f) => f.message).join("\n");
    expect(msgs).toMatch(/describe duties/);
    expect(msgs).toMatch(/no measurable results/);
    expect(msgs).toMatch(/Overused phrases/);
  });

  it("flags present tense in past roles and short-tenure patterns", () => {
    const r = sampleResume();
    r.experience = [0, 1, 2].map((i) => {
      const e = newExperience();
      Object.assign(e, { title: "Clerk", organization: `Shop ${i}`, startDate: `202${i}-01`, endDate: `202${i}-05`, bullets: ["Manage the front desk for 30 guests"] });
      return e;
    });
    const flags = findContentFlags(r);
    expect(flags.some((f) => f.category === "consistency" && /present tense/.test(f.message))).toBe(true);
    expect(flags.some((f) => /under a year/.test(f.message))).toBe(true);
  });

  it("flags unreviewed AI-drafted entries", () => {
    const r = sampleResume();
    r.experience[0].source = "ai";
    r.experience[0].confirmed = false;
    expect(findContentFlags(r).some((f) => /AI-drafted/.test(f.message))).toBe(true);
  });

  it("is included in the quality report", () => {
    const r = sampleResume();
    r.summary = "Passionate go-getter.";
    expect(scoreResume(r).redFlags.some((f) => f.category === "wording")).toBe(true);
  });
});
