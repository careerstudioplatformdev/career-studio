import type { ResumeContent } from "./types";

export type PendingFact = { section: string; id: string; label: string };

/** Everything the user still has to confirm before the resume can be exported. */
export function pendingConfirmations(r: ResumeContent): PendingFact[] {
  const pending: PendingFact[] = [];
  if (!r.contact.confirmed) {
    pending.push({ section: "contact", id: "contact", label: "Contact details" });
  }
  if (r.summary.trim() && !r.summaryConfirmed) {
    pending.push({ section: "summary", id: "summary", label: "Summary" });
  }
  for (const e of r.experience) {
    if (!e.confirmed) {
      pending.push({ section: "experience", id: e.id, label: e.title || e.organization || "Experience entry" });
    }
  }
  for (const e of r.education) {
    if (!e.confirmed) {
      pending.push({ section: "education", id: e.id, label: e.school || e.credential || "Education entry" });
    }
  }
  for (const p of r.projects) {
    if (!p.confirmed) pending.push({ section: "projects", id: p.id, label: p.name || "Project" });
  }
  for (const c of r.certifications) {
    if (!c.confirmed) pending.push({ section: "certifications", id: c.id, label: c.name || "Certification" });
  }
  if (r.skills.length > 0 && !r.skillsConfirmed) {
    pending.push({ section: "skills", id: "skills", label: "Skills" });
  }
  return pending;
}

export function hasMinimumContent(r: ResumeContent): boolean {
  return (
    r.contact.fullName.trim().length > 0 &&
    (r.experience.length > 0 || r.education.length > 0 || r.projects.length > 0)
  );
}

export function isExportReady(r: ResumeContent): boolean {
  return hasMinimumContent(r) && pendingConfirmations(r).length === 0;
}

/** Plain text of the whole resume, used for keyword matching. */
export function resumeText(r: ResumeContent): string {
  const parts: string[] = [r.targetRole, r.summary, ...r.skills];
  for (const e of r.experience) parts.push(e.title, e.organization, ...e.bullets);
  for (const e of r.education) parts.push(e.school, e.credential, e.field, ...e.details);
  for (const p of r.projects) parts.push(p.name, p.role, ...p.bullets);
  for (const c of r.certifications) parts.push(c.name, c.issuer);
  return parts.filter(Boolean).join("\n");
}
