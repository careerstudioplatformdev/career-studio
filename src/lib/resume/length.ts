// Resume length control (1–5 pages). We lay the resume out exactly as the PDF export
// does, then trim lower-priority detail until it fits.
// We never pad: if there isn't enough true content for the target, we say so.

import { StandardFontEmbedder, StandardFonts } from "pdf-lib";
import type { LayoutEntry, ResumeLayout } from "./layout";
import { pagesUsed, planPdf, type Measure } from "./pdf-plan";
import type { PageTarget } from "./types";

let standardMeasure: Measure | null = null;

/** Exact Helvetica metrics (the PDF export's fonts), without creating a PDF. */
function measure(): Measure {
  if (!standardMeasure) {
    const fonts = {
      regular: StandardFontEmbedder.for(StandardFonts.Helvetica as unknown as Parameters<typeof StandardFontEmbedder.for>[0]),
      bold: StandardFontEmbedder.for(StandardFonts.HelveticaBold as unknown as Parameters<typeof StandardFontEmbedder.for>[0]),
      italic: StandardFontEmbedder.for(StandardFonts.HelveticaOblique as unknown as Parameters<typeof StandardFontEmbedder.for>[0]),
    };
    standardMeasure = (text, font, size) => fonts[font].widthOfTextAtSize(text, size);
  }
  return standardMeasure;
}

/** Estimated pages, to one decimal (e.g. 1.4), using the same plan as the PDF export. */
export function estimatePages(layout: ResumeLayout): number {
  const plan = planPdf(layout, measure());
  // Never round a started page away (1.02 pages shows as 1.1, not 1).
  return Math.round(Math.max(plan.pages.length - 0.9, pagesUsed(plan)) * 10) / 10;
}

function pageCount(layout: ResumeLayout): number {
  return planPdf(layout, measure()).pages.length;
}

export type FitResult = {
  layout: ResumeLayout;
  estimatedPages: number;
  target: PageTarget;
  /** Plain-language notes on what was shortened to fit. Nothing is deleted from the saved resume. */
  trimmed: string[];
  /** True when the content is well short of the target; we never pad with filler. */
  underfilled: boolean;
  fits: boolean;
};

const clone = (l: ResumeLayout): ResumeLayout => ({
  ...l,
  sections: l.sections.map((s) => ({ ...s, entries: s.entries?.map((e) => ({ ...e, bullets: [...e.bullets] })) })),
});

// Lower number = trimmed first.
const SECTION_PRIORITY: Record<string, number> = {
  Volunteering: 1,
  Projects: 2,
  Certifications: 3,
  Education: 4,
  Experience: 6,
  Summary: 5,
  Skills: 7,
};

/**
 * Fit the layout to `target` pages by trimming the least important detail first:
 * extra bullets on older roles, education details, project and volunteer bullets,
 * then a long summary. Section headings and entries (titles, employers, dates) are kept.
 */
export function fitToPages(source: ResumeLayout, target: PageTarget): FitResult {
  const layout = clone(source);
  const trimmed: string[] = [];
  const over = () => pageCount(layout) > target;

  // Each pass removes one bullet from the lowest-priority, most-detailed entry,
  // never going below `floor` bullets for that section.
  const floors: [string, number][] = [
    ["Volunteering", 1],
    ["Projects", 2],
    ["Education", 0],
    ["Experience", 3],
    ["Projects", 1],
    ["Experience", 2],
    ["Volunteering", 0],
    ["Projects", 0],
    ["Experience", 1],
  ];

  for (const [title, floor] of floors) {
    const section = layout.sections.find((s) => s.title === title);
    if (!section?.entries) continue;
    let removed = 0;
    while (over()) {
      // Prefer older entries (later in the list) with the most bullets.
      let pick: LayoutEntry | null = null;
      for (const e of [...section.entries].reverse()) {
        if (e.bullets.length > floor && (!pick || e.bullets.length > pick.bullets.length)) pick = e;
      }
      if (!pick) break;
      pick.bullets.pop();
      removed++;
    }
    if (removed > 0) trimmed.push(`Hid ${removed} lower-priority ${title === "Education" ? "detail" : "bullet"}${removed > 1 ? "s" : ""} in ${title}.`);
    if (!over()) break;
  }

  const summary = layout.sections.find((s) => s.title === "Summary");
  if (over() && summary?.text) {
    const sentences = summary.text.match(/[^.!?]+[.!?]+/g) ?? [summary.text];
    if (sentences.length > 2) {
      summary.text = sentences.slice(0, 2).join(" ").trim();
      trimmed.push("Shortened the summary to its first two sentences.");
    }
  }

  // Last resort: drop whole low-priority sections.
  const droppable = [...layout.sections]
    .filter((s) => (SECTION_PRIORITY[s.title] ?? 9) <= 3)
    .sort((a, b) => (SECTION_PRIORITY[a.title] ?? 9) - (SECTION_PRIORITY[b.title] ?? 9));
  for (const s of droppable) {
    if (!over()) break;
    layout.sections = layout.sections.filter((x) => x !== s);
    trimmed.push(`Left out the ${s.title} section.`);
  }

  const estimatedPages = estimatePages(layout);
  return {
    layout,
    estimatedPages,
    target,
    trimmed,
    fits: !over(),
    underfilled: target > 1 && estimatedPages < target - 0.6,
  };
}

/** A sensible default length from years of experience (a common recruiter guideline). */
export function recommendedPages(yearsOfExperience: number): PageTarget {
  if (yearsOfExperience < 8) return 1;
  if (yearsOfExperience < 20) return 2;
  return 3;
}
