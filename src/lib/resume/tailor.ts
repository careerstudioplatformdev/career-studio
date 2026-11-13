// Deterministic tailoring: reorder what the user already has so the most relevant
// facts for a job come first. Adds nothing, removes nothing, changes no wording.

import { extractKeywords, tokenize } from "./jd-match";
import type { ResumeContent } from "./types";

function relevance(text: string, keywords: string[]): number {
  const t = ` ${tokenize(text).join(" ")} `;
  return keywords.reduce((score, k, i) => (t.includes(` ${k} `) ? score + (keywords.length - i) : score), 0);
}

function stableSortBy<T>(xs: T[], score: (x: T) => number): T[] {
  return xs
    .map((x, i) => ({ x, i, s: score(x) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((o) => o.x);
}

export function reorderForJob(r: ResumeContent, jd: string): ResumeContent {
  const keywords = extractKeywords(jd, 30);
  return {
    ...r,
    skills: stableSortBy(r.skills, (s) => relevance(s, keywords)),
    experience: r.experience.map((e) => ({ ...e, bullets: stableSortBy(e.bullets, (b) => relevance(b, keywords)) })),
    projects: stableSortBy(
      r.projects.map((p) => ({ ...p, bullets: stableSortBy(p.bullets, (b) => relevance(b, keywords)) })),
      (p) => relevance([p.name, ...p.bullets].join(" "), keywords),
    ),
  };
}

/**
 * Add a keyword the user has explicitly confirmed they have. It goes into skills only;
 * the user decides whether and where to describe it in a bullet.
 */
export function addConfirmedSkill(r: ResumeContent, skill: string): ResumeContent {
  const s = skill.trim();
  if (!s || r.skills.some((x) => x.toLowerCase() === s.toLowerCase())) return r;
  return { ...r, skills: [...r.skills, s], skillsConfirmed: false };
}
