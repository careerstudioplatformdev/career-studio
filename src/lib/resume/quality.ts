// Transparent, rule-based resume quality score (no job description needed).
// Each category lists the checks behind its points so users can see why.

import { currentMonth, toMonthIndex } from "./dates";
import type { Experience, ResumeContent } from "./types";

export type Check = { label: string; passed: boolean; tip?: string };

export type Category = {
  key: string;
  name: string;
  points: number;
  max: number;
  checks: Check[];
};

export type RedFlag = {
  severity: "high" | "medium" | "low";
  message: string;
  entryId?: string;
};

export type QualityReport = {
  score: number;
  max: number;
  categories: Category[];
  redFlags: RedFlag[];
};

const ACTION_VERBS = new Set(
  (
    "achieved administered advised analyzed answered arranged assembled assisted automated built " +
    "calculated captured championed coached collaborated completed composed conducted configured " +
    "consolidated constructed consulted contributed coordinated created cut debugged decreased " +
    "defined delivered demonstrated deployed designed developed devised directed documented drafted " +
    "drove edited educated eliminated enabled engineered established evaluated executed expanded " +
    "facilitated finalized fixed formulated founded generated grew guided handled helped identified " +
    "implemented improved increased influenced initiated installed instructed integrated interviewed " +
    "introduced investigated launched led maintained managed mentored migrated modeled monitored " +
    "negotiated operated optimized orchestrated organized oversaw participated performed piloted " +
    "planned prepared presented prioritized processed produced programmed promoted proposed " +
    "provided published raised recruited redesigned reduced refactored reorganized replaced reported " +
    "represented researched resolved restructured reviewed revamped scheduled secured served " +
    "shipped simplified solved spearheaded standardized streamlined strengthened supervised " +
    "supported surveyed taught tested tracked trained transformed translated tutored upgraded " +
    "volunteered won wrote"
  ).split(" "),
);

export function allBullets(r: ResumeContent): string[] {
  return [...r.experience.flatMap((e) => e.bullets), ...r.projects.flatMap((p) => p.bullets)]
    .map((b) => b.trim())
    .filter(Boolean);
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function startsWithActionVerb(bullet: string): boolean {
  const first = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";
  return ACTION_VERBS.has(first);
}

function ratio(n: number, d: number): number {
  return d === 0 ? 0 : n / d;
}

function category(key: string, name: string, max: number, checks: Check[], weights?: number[]): Category {
  const w = weights ?? checks.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  const earned = checks.reduce((sum, c, i) => sum + (c.passed ? w[i] : 0), 0);
  return { key, name, max, checks, points: Math.round((earned / total) * max) };
}

export function scoreResume(r: ResumeContent, now: Date = new Date()): QualityReport {
  const bullets = allBullets(r);
  const c = r.contact;

  const contact = category("contact", "Contact details", 10, [
    { label: "Full name", passed: c.fullName.trim().length > 1 },
    {
      label: "Valid email address",
      passed: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim()),
      tip: "Recruiters need a reliable way to reach you.",
    },
    { label: "Phone number", passed: c.phone.replace(/\D/g, "").length >= 10 },
    { label: "City and state (or region)", passed: c.location.trim().length > 1 },
  ]);

  const hasWork = r.experience.length > 0 || r.projects.length > 0;
  const sections = category("sections", "Core sections", 15, [
    {
      label: "Experience or projects",
      passed: hasWork,
      tip: "Internships, volunteering, school and personal projects all count.",
    },
    { label: "Education", passed: r.education.length > 0 },
    { label: "At least 5 skills", passed: r.skills.length >= 5, tip: "List skills you can demonstrate." },
    {
      label: "Target role or summary",
      passed: r.targetRole.trim().length > 0 || r.summary.trim().length > 0,
      tip: "Tell recruiters what you're aiming for.",
    },
  ]);

  const actionRatio = ratio(bullets.filter(startsWithActionVerb).length, bullets.length);
  const goodLength = ratio(
    bullets.filter((b) => {
      const n = wordCount(b);
      return n >= 6 && n <= 30;
    }).length,
    bullets.length,
  );
  const noFirstPerson = bullets.every((b) => !/\b(i|me|my)\b/i.test(b));
  const entriesWithBullets = [...r.experience, ...r.projects];
  const everyEntryHasBullets =
    entriesWithBullets.length > 0 && entriesWithBullets.every((e) => e.bullets.some((b) => b.trim()));

  const bulletCat = category(
    "bullets",
    "Bullet points",
    30,
    [
      {
        label: "Every role or project has at least one bullet",
        passed: everyEntryHasBullets,
        tip: "Describe what you did and what changed because of it.",
      },
      {
        label: "Most bullets start with an action verb",
        passed: bullets.length > 0 && actionRatio >= 0.7,
        tip: 'Start with verbs like "Built", "Led", "Organized".',
      },
      {
        label: "Bullets are 6–30 words",
        passed: bullets.length > 0 && goodLength >= 0.8,
        tip: "Short enough to scan, long enough to show impact.",
      },
      {
        label: 'No first person ("I", "my")',
        passed: bullets.length > 0 && noFirstPerson,
        tip: "Resumes conventionally drop first-person pronouns.",
      },
    ],
    [3, 3, 2, 2],
  );

  const withNumbers = ratio(bullets.filter((b) => /\d/.test(b)).length, bullets.length);
  const impact = category("impact", "Evidence of impact", 15, [
    {
      label: "Some bullets include numbers you can back up",
      passed: bullets.length > 0 && withNumbers >= 0.3,
      tip: "Add counts, time saved or results only if they are true and you can explain them.",
    },
  ]);

  const redFlags = findRedFlags(r, now);
  const dated = [...r.experience, ...r.education];
  const allDated =
    dated.length > 0 &&
    dated.every((e) => toMonthIndex(e.startDate) !== null && (e.current || toMonthIndex(e.endDate, true) !== null));
  const dates = category("dates", "Dates and timeline", 15, [
    { label: "Every role and school has start and end dates", passed: allDated },
    {
      label: "No timeline errors",
      passed: dated.length > 0 && !redFlags.some((f) => f.severity === "high"),
      tip: "Fix end dates before start dates and future dates.",
    },
  ]);

  const totalWords = wordCount(
    [r.summary, ...bullets, ...r.education.flatMap((e) => e.details)].join(" "),
  );
  const format = category("format", "Length and readability", 15, [
    {
      label: "Between 150 and 900 words of content",
      passed: totalWords >= 150 && totalWords <= 900,
      tip: totalWords < 150 ? "Add more detail about what you did." : "Trim to the most relevant points.",
    },
    {
      label: "Summary is under 80 words (or omitted)",
      passed: totalWords > 0 && wordCount(r.summary) <= 80,
    },
    {
      label: "No more than 30 skills",
      passed: r.skills.length > 0 && r.skills.length <= 30,
      tip: "Long skill lists dilute the important ones.",
    },
  ]);

  const categories = [contact, sections, bulletCat, impact, dates, format];
  return {
    score: categories.reduce((a, b) => a + b.points, 0),
    max: categories.reduce((a, b) => a + b.max, 0),
    categories,
    redFlags,
  };
}

function label(e: Experience): string {
  return [e.title, e.organization].filter(Boolean).join(" at ") || "An experience entry";
}

/** Timeline and consistency problems: errors, overlaps and gaps. */
export function findRedFlags(r: ResumeContent, now: Date = new Date()): RedFlag[] {
  const flags: RedFlag[] = [];
  const nowIdx = toMonthIndex(currentMonth(now))!;

  const entries = [
    ...r.experience.map((e) => ({ ...e, name: label(e) })),
    ...r.education.map((e) => ({ ...e, name: e.school || "An education entry" })),
  ];

  for (const e of entries) {
    const s = toMonthIndex(e.startDate);
    const end = e.current ? nowIdx : toMonthIndex(e.endDate, true);
    if (s === null) {
      flags.push({ severity: "medium", message: `${e.name} has no start date.`, entryId: e.id });
    }
    if (!e.current && end === null) {
      flags.push({ severity: "medium", message: `${e.name} has no end date. Mark it as current if it is ongoing.`, entryId: e.id });
    }
    if (s !== null && end !== null && end < s) {
      flags.push({ severity: "high", message: `${e.name} ends before it starts.`, entryId: e.id });
    }
    if (s !== null && s > nowIdx) {
      flags.push({ severity: "high", message: `${e.name} starts in the future.`, entryId: e.id });
    }
    if (!e.current && end !== null && end > nowIdx) {
      flags.push({ severity: "high", message: `${e.name} ends in the future. Mark it as current instead.`, entryId: e.id });
    }
  }

  // Gaps and overlaps between paid/internship roles (volunteering often runs alongside work).
  const jobs = r.experience
    .filter((e) => e.kind !== "volunteer")
    .map((e) => ({
      e,
      s: toMonthIndex(e.startDate),
      end: e.current ? nowIdx : toMonthIndex(e.endDate, true),
    }))
    .filter((j): j is { e: Experience; s: number; end: number } => j.s !== null && j.end !== null && j.end >= j.s)
    .sort((a, b) => a.s - b.s);

  for (let i = 1; i < jobs.length; i++) {
    const prev = jobs[i - 1];
    const cur = jobs[i];
    const gap = cur.s - prev.end;
    if (gap > 6) {
      flags.push({
        severity: "low",
        message: `${Math.floor(gap)}-month gap between ${label(prev.e)} and ${label(cur.e)}. Consider noting study, caregiving, projects or other activity if you're comfortable sharing it.`,
        entryId: cur.e.id,
      });
    } else if (cur.s < prev.end && prev.end - cur.s >= 2) {
      flags.push({
        severity: "low",
        message: `${label(prev.e)} and ${label(cur.e)} overlap. That's fine if you held both roles at once; otherwise check the dates.`,
        entryId: cur.e.id,
      });
    }
  }

  // Duplicate entries.
  const seen = new Set<string>();
  for (const e of r.experience) {
    const key = `${e.title}|${e.organization}|${e.startDate}`.toLowerCase();
    if (e.title && seen.has(key)) {
      flags.push({ severity: "medium", message: `${label(e)} appears more than once.`, entryId: e.id });
    }
    seen.add(key);
  }

  return flags;
}
