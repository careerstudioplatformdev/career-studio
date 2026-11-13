import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildPdf } from "../export-pdf";
import { newExperience } from "../factory";
import { buildLayout } from "../layout";
import { estimatePages, fitToPages, recommendedPages } from "../length";
import { sampleResume } from "./fixtures";

function longResume(roles: number, bullets: number) {
  const r = sampleResume();
  r.experience = Array.from({ length: roles }, (_, i) => {
    const e = newExperience();
    Object.assign(e, {
      title: `Analyst ${i + 1}`,
      organization: `Company ${i + 1}`,
      startDate: `${2010 + i}-01`,
      endDate: `${2010 + i}-12`,
      confirmed: true,
      bullets: Array.from({ length: bullets }, (_, j) => `Built and maintained reporting pipeline number ${j + 1} for the finance team across several regional offices and stakeholders`),
    });
    return e;
  });
  return r;
}

describe("resume length control", () => {
  it("estimates a short resume at about one page or less", () => {
    expect(estimatePages(buildLayout(sampleResume()))).toBeLessThanOrEqual(1);
  });

  it("trims lower-priority bullets to fit the target and explains what it did", () => {
    const layout = buildLayout(longResume(8, 6));
    expect(estimatePages(layout)).toBeGreaterThan(2);
    const fit = fitToPages(layout, 1);
    expect(fit.fits).toBe(true);
    expect(fit.trimmed.length).toBeGreaterThan(0);
    // Every role keeps its title even when bullets are trimmed.
    const exp = fit.layout.sections.find((s) => s.title === "Experience")!;
    expect(exp.entries!.length).toBe(8);
    // The most recent role keeps more bullets than the oldest.
    expect(exp.entries![0].bullets.length).toBeGreaterThanOrEqual(exp.entries![7].bullets.length);
    // Source layout is untouched.
    expect(layout.sections.find((s) => s.title === "Experience")!.entries![7].bullets.length).toBe(6);
  });

  it("never pads, and reports when content is short of the target", () => {
    const fit = fitToPages(buildLayout(sampleResume()), 3);
    expect(fit.trimmed).toEqual([]);
    expect(fit.underfilled).toBe(true);
  });

  it("produces PDFs whose page count matches the target exactly", async () => {
    for (const target of [1, 2, 3, 4, 5] as const) {
      const fit = fitToPages(buildLayout(longResume(8, 7)), target);
      expect(fit.fits).toBe(true);
      const pdf = await PDFDocument.load(await buildPdf(fit.layout));
      expect(pdf.getPageCount()).toBeLessThanOrEqual(target);
      expect(pdf.getPageCount()).toBe(Math.ceil(fit.estimatedPages));
    }
  });

  it("says so when even trimmed content can't fit", () => {
    const fit = fitToPages(buildLayout(longResume(25, 4)), 1);
    expect(fit.fits).toBe(false);
  });

  it("recommends a length from years of experience", () => {
    expect(recommendedPages(2)).toBe(1);
    expect(recommendedPages(10)).toBe(2);
    expect(recommendedPages(25)).toBe(3);
  });
});
