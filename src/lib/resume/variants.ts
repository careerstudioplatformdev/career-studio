// Resume versions proposed by the AI builder agents, and how they are made safe
// and applied. Variants may only rephrase existing content.

import { resumeText } from "./facts";
import { unsupportedNumbers } from "./impact";
import type { ResumeContent } from "./types";

export type ResumeVariant = {
  summary: string;
  entries: { id: string; bullets: string[] }[];
  skills: string[];
  notes: string;
};

export type SanitizedVariant = ResumeVariant & { removed: string[] };

/**
 * Enforce the "never invent" rule on an AI version:
 * - entries must match existing experience/project ids;
 * - skills must already be on the resume (only reordering allowed);
 * - any bullet or summary with a number the user never stated is dropped.
 */
export function sanitizeVariant(v: ResumeVariant, r: ResumeContent, extraSources: string[] = []): SanitizedVariant {
  const sources = [resumeText(r), r.contact.fullName, ...extraSources];
  const removed: string[] = [];
  const ids = new Map<string, string[]>([
    ...r.experience.map((e) => [e.id, e.bullets] as [string, string[]]),
    ...r.projects.map((p) => [p.id, p.bullets] as [string, string[]]),
  ]);

  const check = (text: string) => {
    const bad = unsupportedNumbers(text, sources);
    if (bad.length) removed.push(`"${text}" (unsupported: ${bad.join(", ")})`);
    return bad.length === 0;
  };

  const entries = v.entries
    .filter((e) => ids.has(e.id))
    .map((e) => {
      const kept = e.bullets.map((b) => b.trim()).filter(Boolean).filter(check);
      return { id: e.id, bullets: kept.length ? kept : ids.get(e.id)! };
    });

  const have = new Map(r.skills.map((s) => [s.toLowerCase(), s]));
  const skills = [...new Set(v.skills.map((s) => have.get(s.trim().toLowerCase())).filter((s): s is string => Boolean(s)))];
  for (const s of r.skills) if (!skills.includes(s)) skills.push(s);

  const summary = v.summary.trim() && check(v.summary.trim()) ? v.summary.trim() : r.summary;
  return { summary, entries, skills, notes: v.notes, removed };
}

/** Apply a version. Rewritten items become unconfirmed AI text the user must re-check. */
export function applyVariant(r: ResumeContent, v: ResumeVariant): ResumeContent {
  const byId = new Map(v.entries.map((e) => [e.id, e.bullets]));
  const changed = (a: string[], b: string[]) => a.length !== b.length || a.some((x, i) => x !== b[i]);
  const summaryChanged = v.summary.trim() !== r.summary.trim();
  return {
    ...r,
    summary: v.summary,
    summaryConfirmed: summaryChanged ? false : r.summaryConfirmed,
    skills: v.skills.length ? v.skills : r.skills,
    experience: r.experience.map((e) => {
      const b = byId.get(e.id);
      return b && changed(b, e.bullets) ? { ...e, bullets: b, confirmed: false, source: "ai" as const } : e;
    }),
    projects: r.projects.map((p) => {
      const b = byId.get(p.id);
      return b && changed(b, p.bullets) ? { ...p, bullets: b, confirmed: false, source: "ai" as const } : p;
    }),
  };
}
