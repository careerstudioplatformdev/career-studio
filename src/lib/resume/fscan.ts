// Recruiter Gaze F-Scan. Eye-tracking studies show recruiters skim a resume in an
// "F" pattern: across the top, down the left edge, and across the first line of
// each section. This checks what a skimming reader actually sees in those zones.

import type { ResumeLayout } from "./layout";
import { startsWithActionVerb } from "./quality";

export type FScanZone = {
  key: "top" | "titles" | "leftEdge" | "headings";
  name: string;
  description: string;
  points: number;
  max: number;
  findings: { ok: boolean; text: string }[];
};

export type FScanResult = {
  score: number;
  zones: FScanZone[];
  /** Words a skimmer reads: first words of each bullet, used for the overlay. */
  leftEdgeWords: number;
};

const STANDARD_HEADINGS = new Set(["Summary", "Experience", "Education", "Skills", "Projects", "Certifications", "Volunteering"]);

function norm(s: string) {
  return s.toLowerCase();
}

/** First `n` words of a bullet: what the eye actually catches on the left edge. */
export function leftEdge(bullet: string, n = 3): string {
  return bullet.trim().split(/\s+/).slice(0, n).join(" ");
}

export function fScan(layout: ResumeLayout, targetRole: string, keywords: string[] = []): FScanResult {
  const zones: FScanZone[] = [];
  const kw = keywords.map(norm).filter(Boolean);
  const roleWords = norm(targetRole).split(/\s+/).filter((w) => w.length > 2);

  // 1. Top band: name, contact, summary first sentence (first ~6 seconds of attention).
  const summary = layout.sections.find((s) => s.title === "Summary")?.text ?? "";
  const firstSentence = (summary.match(/^[^.!?]+[.!?]?/) ?? [""])[0];
  const topText = norm(firstSentence);
  const top: FScanZone["findings"] = [
    { ok: Boolean(layout.name), text: layout.name ? "Your name is the first thing seen." : "Add your name at the top." },
    { ok: /@/.test(layout.contactLine), text: /@/.test(layout.contactLine) ? "Contact details sit right under your name." : "Put an email address under your name." },
    {
      ok: Boolean(summary) && (roleWords.length === 0 || roleWords.some((w) => topText.includes(w))),
      text: !summary
        ? "No summary: the top band has nothing about what you do. Add 2–3 lines naming your target role."
        : roleWords.length && !roleWords.some((w) => topText.includes(w))
          ? `The first line of your summary doesn't say "${targetRole}". Lead with it.`
          : "The first line of your summary tells a skimmer what you do.",
    },
  ];
  if (kw.length) {
    const hits = kw.filter((k) => topText.includes(k));
    top.push({
      ok: hits.length >= Math.min(2, kw.length),
      text: hits.length
        ? `Top band already shows: ${hits.slice(0, 4).join(", ")}.`
        : "None of the job's top keywords appear in your first line. Mention one or two that are true for you.",
    });
  }
  zones.push(zone("top", "Top band", "The first horizontal sweep: name, contact and the first line of your summary.", 35, top));

  // 2. Second sweep: the most recent job title and employer should be high on the page and clear.
  const sections = layout.sections;
  const expIdx = sections.findIndex((s) => s.title === "Experience" || s.title === "Projects");
  const firstEntry = expIdx >= 0 ? sections[expIdx].entries?.[0] : undefined;
  const titles: FScanZone["findings"] = [
    {
      ok: expIdx >= 0 && expIdx <= 1,
      text:
        expIdx < 0
          ? "No experience or projects section for the second sweep to land on."
          : expIdx <= 1
            ? `${sections[expIdx].title} starts near the top, where the second sweep lands.`
            : `${sections[expIdx].title} is section ${expIdx + 1}. Move it up so the second sweep finds it.`,
    },
    {
      ok: Boolean(firstEntry?.heading && firstEntry.dates),
      text: firstEntry?.heading
        ? firstEntry.dates
          ? `Most recent: "${firstEntry.heading}" with dates on the same line.`
          : `"${firstEntry.heading}" has no dates beside it; skimmers look for them on the right.`
        : "Your first entry is missing a title.",
    },
  ];
  if (roleWords.length && firstEntry?.heading) {
    const close = roleWords.some((w) => norm(firstEntry.heading).includes(w));
    titles.push({
      ok: close,
      text: close
        ? "Your most recent title echoes your target role."
        : "Your most recent title differs from the target role. Make sure the first bullet bridges the gap.",
    });
  }
  zones.push(zone("titles", "Second sweep", "Job titles, employers and dates of your most recent roles.", 25, titles));

  // 3. Left edge: the first 2–3 words of each bullet are often all that is read.
  const bullets = sections.flatMap((s) => s.entries ?? []).flatMap((e) => e.bullets);
  const verbStart = bullets.filter(startsWithActionVerb).length;
  const edgeKw = kw.length ? bullets.filter((b) => kw.some((k) => norm(leftEdge(b, 5)).includes(k))).length : 0;
  const weakStarts = bullets.filter((b) => /^(responsible|duties|worked|helped|tasked|involved|assisted|participated|was|i)\b/i.test(b));
  const left: FScanZone["findings"] = [
    {
      ok: bullets.length > 0 && verbStart / bullets.length >= 0.7,
      text: bullets.length
        ? `${verbStart} of ${bullets.length} bullets start with a strong action verb.`
        : "No bullets yet. The left edge is where skimmers read most.",
    },
    {
      ok: weakStarts.length === 0,
      text: weakStarts.length
        ? `${weakStarts.length} bullet${weakStarts.length > 1 ? "s start" : " starts"} weakly ("${leftEdge(weakStarts[0], 2)}…"). Lead with the action or result.`
        : "No bullets start with filler words.",
    },
  ];
  if (kw.length) {
    left.push({
      ok: edgeKw >= Math.min(2, bullets.length),
      text: edgeKw ? `${edgeKw} bullet${edgeKw > 1 ? "s put" : " puts"} a job keyword in the first five words.` : "No bullet puts a job keyword near the start, where eyes land.",
    });
  }
  zones.push(zone("leftEdge", "Left edge", "The vertical stem of the F: the first words of every bullet.", 30, left));

  // 4. Headings: standard names so both people and ATS find sections fast.
  const nonStandard = sections.filter((s) => !STANDARD_HEADINGS.has(s.title));
  zones.push(
    zone("headings", "Section headings", "Clear, standard headings let the eye jump between sections.", 10, [
      { ok: nonStandard.length === 0, text: nonStandard.length ? `Unusual headings: ${nonStandard.map((s) => s.title).join(", ")}.` : "All headings use standard names." },
    ]),
  );

  return { score: zones.reduce((a, z) => a + z.points, 0), zones, leftEdgeWords: bullets.length * 3 };
}

function zone(key: FScanZone["key"], name: string, description: string, max: number, findings: FScanZone["findings"]): FScanZone {
  const ok = findings.filter((f) => f.ok).length;
  return { key, name, description, max, findings, points: findings.length ? Math.round((ok / findings.length) * max) : 0 };
}
