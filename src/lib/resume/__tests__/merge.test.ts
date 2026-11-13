import { describe, expect, it } from "vitest";
import { emptyResume } from "../factory";
import { mergeDraft, type DraftPatch } from "../merge";
import { applyVariant, sanitizeVariant } from "../variants";
import { sampleResume } from "./fixtures";

function patch(p: Partial<DraftPatch>): DraftPatch {
  return {
    targetRole: "",
    contact: { fullName: "", email: "", phone: "", location: "", links: [] },
    summary: "",
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    skills: [],
    ...p,
  };
}

const STORY = "I'm Sam Rivera. I worked at Blue Cafe from 2023 to 2025 as a barista, serving about 150 customers a day. I trained 2 new hires.";

describe("mergeDraft (AI coach output)", () => {
  it("adds new facts as unconfirmed AI entries", () => {
    const { resume, report } = mergeDraft(
      emptyResume(),
      patch({
        contact: { fullName: "Sam Rivera", email: "", phone: "", location: "", links: [] },
        experience: [{ kind: "job", title: "Barista", organization: "Blue Cafe", location: "", startDate: "2023", endDate: "2025", current: false, bullets: ["Served about 150 customers a day", "Trained 2 new hires"] }],
        skills: ["Customer service"],
      }),
      [STORY],
    );
    expect(resume.contact.fullName).toBe("Sam Rivera");
    expect(resume.experience[0]).toMatchObject({ source: "ai", confirmed: false, startDate: "2023", endDate: "2025" });
    expect(resume.experience[0].bullets).toHaveLength(2);
    expect(report.blocked).toEqual([]);
    expect(report.added.length).toBeGreaterThan(0);
  });

  it("blocks bullets with numbers and dates the user never gave", () => {
    const { resume, report } = mergeDraft(
      emptyResume(),
      patch({
        experience: [{ kind: "job", title: "Barista", organization: "Blue Cafe", location: "", startDate: "2021-03", endDate: "", current: true, bullets: ["Increased sales by 30%", "Served about 150 customers a day"] }],
        summary: "Barista with 5 years of experience.",
      }),
      [STORY],
    );
    expect(resume.experience[0].bullets).toEqual(["Served about 150 customers a day"]);
    expect(resume.experience[0].startDate).toBe("");
    expect(resume.summary).toBe("");
    expect(report.blocked).toHaveLength(2);
  });

  it("never overwrites confirmed content", () => {
    const r = sampleResume();
    const { resume } = mergeDraft(
      r,
      patch({
        contact: { fullName: "Someone Else", email: "x@y.z", phone: "", location: "", links: [] },
        experience: [{ kind: "internship", title: "Data Intern", organization: "Acme Corp", location: "", startDate: "", endDate: "", current: false, bullets: ["New bullet"] }],
      }),
      ["New bullet"],
    );
    expect(resume.contact.fullName).toBe("Jordan Lee");
    expect(resume.experience).toHaveLength(1);
    expect(resume.experience[0].bullets).not.toContain("New bullet");
  });

  it("appends new bullets to a matching unconfirmed entry without duplicates", () => {
    const first = mergeDraft(emptyResume(), patch({ experience: [{ kind: "job", title: "Barista", organization: "Blue Cafe", location: "", startDate: "", endDate: "", current: false, bullets: ["Trained 2 new hires"] }] }), [STORY]).resume;
    const second = mergeDraft(first, patch({ experience: [{ kind: "job", title: "Barista", organization: "Blue Cafe", location: "", startDate: "", endDate: "", current: false, bullets: ["Trained 2 new hires", "Served about 150 customers a day"] }] }), [STORY]).resume;
    expect(second.experience).toHaveLength(1);
    expect(second.experience[0].bullets).toEqual(["Trained 2 new hires", "Served about 150 customers a day"]);
  });
});

describe("seven-agent versions", () => {
  it("drops unknown entries, invented skills and unsupported numbers", () => {
    const r = sampleResume();
    const id = r.experience[0].id;
    const v = sanitizeVariant(
      {
        summary: "Analyst who boosted revenue 25%.",
        entries: [
          { id, bullets: ["Built 3 Excel dashboards for weekly sales", "Saved $50,000 annually"] },
          { id: "made-up", bullets: ["Led a team"] },
        ],
        skills: ["SQL", "Kubernetes", "Python"],
        notes: "",
      },
      r,
    );
    expect(v.entries).toHaveLength(1);
    expect(v.entries[0].bullets).toEqual(["Built 3 Excel dashboards for weekly sales"]);
    expect(v.skills).not.toContain("Kubernetes");
    expect(v.skills.slice(0, 2)).toEqual(["SQL", "Python"]);
    expect(v.skills).toHaveLength(r.skills.length);
    expect(v.summary).toBe(r.summary);
    expect(v.removed).toHaveLength(2);
  });

  it("applying a version marks changed entries for re-confirmation", () => {
    const r = sampleResume();
    const id = r.experience[0].id;
    const next = applyVariant(r, { summary: "New summary", entries: [{ id, bullets: ["Rewritten"] }], skills: r.skills, notes: "" });
    expect(next.experience[0]).toMatchObject({ bullets: ["Rewritten"], confirmed: false, source: "ai" });
    expect(next.summaryConfirmed).toBe(false);
    expect(next.education[0].confirmed).toBe(true);
  });
});
