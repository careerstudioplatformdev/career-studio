// Content red flags: wording, evidence, contact and consistency problems a recruiter
// would notice. Timeline flags (gaps, overlaps, date errors) live in quality.ts.

import { toMonthIndex } from "./dates";
import { hasMetric } from "./impact";
import type { RedFlag } from "./quality";
import type { ResumeContent } from "./types";

const VAGUE = [
  /^responsible for\b/i,
  /^duties (included|include)\b/i,
  /^worked on\b/i,
  /^helped (with|to)\b/i,
  /^tasked with\b/i,
  /^involved in\b/i,
  /^assisted (with|in)\b/i,
  /^participated in\b/i,
];

const CLICHES = [
  "hard worker",
  "hard-working",
  "hardworking",
  "team player",
  "go-getter",
  "self-starter",
  "results-driven",
  "results-oriented",
  "detail-oriented",
  "think outside the box",
  "synergy",
  "dynamic",
  "passionate",
  "rockstar",
  "ninja",
  "guru",
  "best of breed",
  "go-to person",
  "proven track record",
];

const PRESENT_VERBS = /^(manage|lead|build|develop|create|design|support|handle|coordinate|maintain|train|serve|assist|oversee|run|write|analyze|answer|process|prepare)s?\b/i;
const PAST_VERBS = /^[a-z]+ed\b|^(led|built|ran|wrote|made|grew|won|taught|drove|sold|cut|set|held|spoke|met|kept|found|brought|began|chose|gave|took)\b/i;

function label(title: string, org: string): string {
  return [title, org].filter(Boolean).join(" at ") || "An entry";
}

export function findContentFlags(r: ResumeContent): RedFlag[] {
  const flags: RedFlag[] = [];
  const c = r.contact;

  // Contact
  const email = c.email.trim().toLowerCase();
  if (email && /(sexy|hot|420|69|babe|cutie|princess|thug|killer|xxx)/.test(email.split("@")[0])) {
    flags.push({ category: "contact", severity: "medium", message: "Your email address may not read as professional. A simple firstname.lastname address works best." });
  }
  if (c.links.some((l) => /facebook\.com|instagram\.com|tiktok\.com/i.test(l))) {
    flags.push({ category: "contact", severity: "low", message: "Personal social media links usually don't belong on a resume. LinkedIn, GitHub or a portfolio are safer." });
  }
  if (/\d{1,5}\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|lane|ln|dr|drive)\b/i.test(c.location)) {
    flags.push({ category: "contact", severity: "low", message: "A full street address isn't needed. City and state are enough and protect your privacy." });
  }

  // Wording and evidence per role
  const roles = [
    ...r.experience.map((e) => ({ id: e.id, name: label(e.title, e.organization), bullets: e.bullets, current: e.current, isRole: e.kind !== "volunteer" })),
    ...r.projects.map((p) => ({ id: p.id, name: p.name || "A project", bullets: p.bullets, current: false, isRole: false })),
  ];

  for (const role of roles) {
    const bullets = role.bullets.map((b) => b.trim()).filter(Boolean);
    const vague = bullets.filter((b) => VAGUE.some((v) => v.test(b)));
    if (vague.length) {
      flags.push({
        category: "wording",
        severity: "medium",
        entryId: role.id,
        message: `${role.name}: ${vague.length} bullet${vague.length > 1 ? "s describe" : " describes"} duties ("${vague[0].split(/\s+/).slice(0, 3).join(" ")}…") instead of results. Start with what you did and what changed.`,
      });
    }
    if (role.isRole && bullets.length >= 2 && !bullets.some(hasMetric)) {
      flags.push({
        category: "evidence",
        severity: "low",
        entryId: role.id,
        message: `${role.name} has no measurable results. Add a number you can back up (people served, time saved, volume handled) with the contribution builder.`,
      });
    }
    const long = bullets.filter((b) => b.split(/\s+/).length > 35);
    if (long.length) {
      flags.push({ category: "wording", severity: "low", entryId: role.id, message: `${role.name}: ${long.length} bullet${long.length > 1 ? "s are" : " is"} over 35 words. Recruiters skim; split or tighten.` });
    }
    const firstWords = bullets.map((b) => b.split(/\s+/)[0]?.toLowerCase()).filter(Boolean);
    const repeated = firstWords.find((w, i) => firstWords.indexOf(w) !== i && firstWords.filter((x) => x === w).length >= 3);
    if (repeated) {
      flags.push({ category: "wording", severity: "low", entryId: role.id, message: `${role.name}: three or more bullets start with "${repeated}". Vary your verbs.` });
    }
    // Tense: past roles should use past tense.
    if (!role.current && role.isRole && bullets.some((b) => PRESENT_VERBS.test(b) && !PAST_VERBS.test(b))) {
      flags.push({ category: "consistency", severity: "low", entryId: role.id, message: `${role.name} has ended but some bullets use present tense ("Manage…"). Use past tense for past roles.` });
    }
  }

  // Clichés anywhere in summary or bullets
  const corpus = [r.summary, ...roles.flatMap((x) => x.bullets)].join(" \n ").toLowerCase();
  const found = CLICHES.filter((p) => corpus.includes(p));
  if (found.length) {
    flags.push({
      category: "wording",
      severity: "low",
      message: `Overused phrases: ${found.slice(0, 4).map((f) => `"${f}"`).join(", ")}. Show these qualities with an example instead.`,
    });
  }
  if (/\b(i|me|my)\b/i.test(roles.flatMap((x) => x.bullets).join(" "))) {
    flags.push({ category: "wording", severity: "low", message: 'Some bullets use "I", "me" or "my". Resumes conventionally drop first-person pronouns.' });
  }

  // Short tenures pattern (three or more completed paid roles under a year)
  const short = r.experience.filter((e) => {
    if (e.kind === "volunteer" || e.kind === "internship" || e.current) return false;
    const s = toMonthIndex(e.startDate);
    const end = toMonthIndex(e.endDate, true);
    return s !== null && end !== null && end - s < 11;
  });
  if (short.length >= 3) {
    flags.push({
      category: "consistency",
      severity: "medium",
      message: `${short.length} jobs lasted under a year. If some were contract, seasonal or temporary roles, say so in the title (e.g. "Contract") so it doesn't read as job-hopping.`,
    });
  }

  // Skills listed but never shown in experience
  const evidence = roles.flatMap((x) => x.bullets).join(" ").toLowerCase();
  if (r.skills.length >= 5 && roles.length > 0) {
    const unshown = r.skills.filter((s) => s.length > 2 && !evidence.includes(s.toLowerCase()));
    if (unshown.length / r.skills.length > 0.7) {
      flags.push({
        category: "evidence",
        severity: "low",
        message: `Most of your skills (${unshown.slice(0, 3).join(", ")}…) aren't shown in any bullet. Mention your top skills where you used them.`,
      });
    }
  }

  // Target role vs summary consistency
  if (r.targetRole.trim() && r.summary.trim()) {
    const key = r.targetRole.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    if (key.length && !key.some((w) => r.summary.toLowerCase().includes(w))) {
      flags.push({ category: "consistency", severity: "low", message: `Your summary doesn't mention your target role (${r.targetRole}). Recruiters read the top first.` });
    }
  }

  // AI-drafted content still unreviewed
  const aiUnconfirmed = [...r.experience, ...r.education, ...r.projects, ...r.certifications].filter((x) => x.source === "ai" && !x.confirmed).length;
  if (aiUnconfirmed > 0) {
    flags.push({ category: "evidence", severity: "medium", message: `${aiUnconfirmed} AI-drafted entr${aiUnconfirmed > 1 ? "ies need" : "y needs"} your review. Check every word is true before confirming.` });
  }

  return flags;
}
