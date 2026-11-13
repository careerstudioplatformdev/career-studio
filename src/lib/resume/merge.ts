// Merge an AI-drafted patch (built only from the user's own words) into a resume.
// Rules: never overwrite anything the user confirmed; fill blanks; add new entries
// as unconfirmed "ai" facts; append bullets that aren't already there.

import { newCertification, newEducation, newExperience, newProject } from "./factory";
import { numbersIn, unsupportedNumbers } from "./impact";
import type { Experience, ExperienceKind, ResumeContent } from "./types";

export type DraftExperience = {
  kind: ExperienceKind;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
};
export type DraftEducation = { school: string; credential: string; field: string; startDate: string; endDate: string; current: boolean; details: string[] };
export type DraftProject = { name: string; role: string; link: string; bullets: string[] };
export type DraftCertification = { name: string; issuer: string; date: string };

export type DraftPatch = {
  targetRole: string;
  contact: { fullName: string; email: string; phone: string; location: string; links: string[] };
  summary: string;
  experience: DraftExperience[];
  education: DraftEducation[];
  projects: DraftProject[];
  certifications: DraftCertification[];
  skills: string[];
};

export type MergeReport = { added: string[]; blocked: string[] };

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const datePattern = /^(\d{4}(-(0[1-9]|1[0-2]))?)?$/;

/**
 * Remove AI text that contains numbers the user never said. The bullet is dropped
 * (not edited) and reported, so the user can add the real figure themselves.
 */
function grounded(lines: string[], sources: string[], blocked: string[]): string[] {
  return lines
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => {
      const bad = unsupportedNumbers(l, sources);
      if (bad.length) blocked.push(`"${l}" (contains ${bad.join(", ")}, which you didn't mention)`);
      return bad.length === 0;
    });
}

function addBullets(existing: string[], incoming: string[]): string[] {
  const out = [...existing];
  for (const b of incoming) if (!out.some((x) => same(x, b))) out.push(b);
  return out;
}

export function mergeDraft(r: ResumeContent, patch: DraftPatch, sources: string[]): { resume: ResumeContent; report: MergeReport } {
  const added: string[] = [];
  const blocked: string[] = [];
  // A date is kept only if its year appears in what the user said; otherwise it stays blank.
  const known = new Set(sources.flatMap(numbersIn));
  const safeDate = (d: string) => {
    const v = d.trim();
    return datePattern.test(v) && v && known.has(v.slice(0, 4)) ? v : "";
  };
  const next: ResumeContent = structuredClone(r);

  if (!next.targetRole.trim() && patch.targetRole.trim()) next.targetRole = patch.targetRole.trim();

  // Contact: fill blanks only, and only if the user hasn't confirmed contact yet.
  if (!next.contact.confirmed) {
    const c = next.contact;
    for (const k of ["fullName", "email", "phone", "location"] as const) {
      if (!c[k].trim() && patch.contact[k]?.trim()) {
        c[k] = patch.contact[k].trim();
        added.push(`Contact: ${k === "fullName" ? "name" : k}`);
      }
    }
    for (const l of patch.contact.links ?? []) if (l.trim() && !c.links.some((x) => same(x, l))) c.links.push(l.trim());
  }

  if (!next.summary.trim() && patch.summary.trim()) {
    const ok = grounded([patch.summary], sources, blocked);
    if (ok.length) {
      next.summary = ok[0];
      next.summaryConfirmed = false;
      added.push("Summary");
    }
  }

  for (const d of patch.experience) {
    if (!d.title.trim() && !d.organization.trim()) continue;
    const bullets = grounded(d.bullets, sources, blocked);
    const match = next.experience.find((e) => same(e.organization, d.organization) && (same(e.title, d.title) || !e.title || !d.title));
    if (match) {
      if (match.confirmed) continue;
      const before = match.bullets.length;
      match.bullets = addBullets(match.bullets, bullets);
      if (!match.title && d.title) match.title = d.title;
      if (!match.startDate) match.startDate = safeDate(d.startDate);
      if (!match.endDate && !match.current) {
        match.endDate = safeDate(d.endDate);
        match.current = d.current;
      }
      if (match.bullets.length > before) added.push(`${match.bullets.length - before} bullet(s) for ${match.title || match.organization}`);
    } else {
      const e: Experience = {
        ...newExperience("ai", d.kind),
        title: d.title.trim(),
        organization: d.organization.trim(),
        location: d.location.trim(),
        startDate: safeDate(d.startDate),
        endDate: d.current ? "" : safeDate(d.endDate),
        current: d.current,
        bullets,
      };
      next.experience.push(e);
      added.push(`${d.kind === "volunteer" ? "Volunteering" : "Experience"}: ${[e.title, e.organization].filter(Boolean).join(" at ")}`);
    }
  }

  for (const d of patch.education) {
    if (!d.school.trim()) continue;
    const match = next.education.find((e) => same(e.school, d.school));
    const details = grounded(d.details, sources, blocked);
    if (match) {
      if (!match.confirmed) match.details = addBullets(match.details, details);
      continue;
    }
    next.education.push({
      ...newEducation("ai"),
      school: d.school.trim(),
      credential: d.credential.trim(),
      field: d.field.trim(),
      startDate: safeDate(d.startDate),
      endDate: d.current ? "" : safeDate(d.endDate),
      current: d.current,
      details,
    });
    added.push(`Education: ${d.school.trim()}`);
  }

  for (const d of patch.projects) {
    if (!d.name.trim()) continue;
    const bullets = grounded(d.bullets, sources, blocked);
    const match = next.projects.find((p) => same(p.name, d.name));
    if (match) {
      if (!match.confirmed) match.bullets = addBullets(match.bullets, bullets);
      continue;
    }
    next.projects.push({ ...newProject("ai"), name: d.name.trim(), role: d.role.trim(), link: d.link.trim(), bullets });
    added.push(`Project: ${d.name.trim()}`);
  }

  for (const d of patch.certifications) {
    if (!d.name.trim() || next.certifications.some((c) => same(c.name, d.name))) continue;
    next.certifications.push({ ...newCertification("ai"), name: d.name.trim(), issuer: d.issuer.trim(), date: safeDate(d.date) });
    added.push(`Certification: ${d.name.trim()}`);
  }

  const newSkills = patch.skills.map((s) => s.trim()).filter((s) => s && !next.skills.some((x) => same(x, s)));
  if (newSkills.length) {
    next.skills = [...next.skills, ...newSkills];
    next.skillsConfirmed = false;
    added.push(`${newSkills.length} skill(s)`);
  }

  return { resume: next, report: { added, blocked } };
}
