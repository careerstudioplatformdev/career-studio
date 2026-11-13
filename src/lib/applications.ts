// Job application pipeline (Module 2, AI Job Agent, candidate-approved).
// Nothing is submitted for the candidate: they approve each application and apply
// on the employer's own site. Automated submission needs platform permission first.

export const STATUSES = ["saved", "tailoring", "ready", "applied", "interviewing", "offer", "rejected", "withdrawn"] as const;
export type ApplicationStatus = (typeof STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  saved: "Saved",
  tailoring: "Tailoring",
  ready: "Ready to approve",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export type Application = {
  id: string;
  resume_id: string | null;
  company: string;
  job_title: string;
  job_url: string;
  description: string;
  status: ApplicationStatus;
  match_score: number | null;
  cover_letter: string;
  notes: string;
  approved_at: string | null;
  applied_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalCheck = { label: string; ok: boolean };

/** What must be true before the candidate approves an application. */
export function approvalChecklist(app: Application, resume: { status: string } | null): ApprovalCheck[] {
  return [
    { label: "A resume is attached", ok: Boolean(app.resume_id && resume) },
    { label: "That resume is approved (every fact confirmed and attested)", ok: resume?.status === "approved" },
    { label: "The job posting link is saved", ok: /^https?:\/\//i.test(app.job_url) },
  ];
}

export function isSafeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Simple, explainable patterns across outcomes (needs a few decided applications). */
export function outcomeInsights(apps: Application[]): string[] {
  const decided = apps.filter((a) => ["interviewing", "offer", "rejected"].includes(a.status));
  if (decided.length < 3) return [];
  const avg = (xs: Application[]) => {
    const s = xs.map((a) => a.match_score).filter((x): x is number => x !== null);
    return s.length ? Math.round(s.reduce((a, b) => a + b, 0) / s.length) : null;
  };
  const won = avg(decided.filter((a) => a.status !== "rejected"));
  const lost = avg(decided.filter((a) => a.status === "rejected"));
  const out: string[] = [];
  if (won !== null && lost !== null && won - lost >= 8) {
    out.push(`Applications that reached interviews averaged a ${won} match score vs ${lost} for ones that didn't. Prioritize roles where you score ${Math.max(won - 5, 50)}+ or tailor further before applying.`);
  }
  const noLetter = decided.filter((a) => a.status === "rejected" && !a.cover_letter.trim()).length;
  if (noLetter >= 2) out.push(`${noLetter} unsuccessful applications had no cover letter. Consider adding one for roles you care about.`);
  const rate = Math.round((decided.filter((a) => a.status !== "rejected").length / decided.length) * 100);
  out.push(`${rate}% of your decided applications reached the interview stage.`);
  return out;
}
