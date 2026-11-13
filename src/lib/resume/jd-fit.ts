// "Fit your resume to a job": an explainable ATS match report. Every number here
// can be traced to a rule the user can see. Nothing is predicted about hiring.

import { monthsCovered } from "./dates";
import { extractKeywords, tokenize } from "./jd-match";
import type { ResumeContent } from "./types";

export type KeywordPriority = "critical" | "important" | "nice";

export type PrioritizedKeyword = {
  term: string;
  priority: KeywordPriority;
  /** Times it appears in the job description. */
  mentions: number;
  /** Where in the resume it was found, if anywhere. */
  foundIn: string[];
};

export type Seniority = "intern" | "entry" | "mid" | "senior" | "lead" | "manager" | "director" | "executive";

export type FitCheck = { key: string; name: string; points: number; max: number; status: "ok" | "partial" | "gap"; detail: string };

export type JdFit = {
  score: number;
  checks: FitCheck[];
  keywords: PrioritizedKeyword[];
  missingCritical: string[];
  jobTitle: string;
  requiredYears: number | null;
  candidateYears: number;
  jobSeniority: Seniority | null;
  candidateSeniority: Seniority | null;
  requiredEducation: string | null;
};

const SENIORITY_ORDER: Seniority[] = ["intern", "entry", "mid", "senior", "lead", "manager", "director", "executive"];

const SENIORITY_PATTERNS: [Seniority, RegExp][] = [
  ["executive", /\b(chief|ceo|cto|cfo|coo|vp|vice president|head of)\b/i],
  ["director", /\bdirector\b/i],
  ["manager", /\bmanager\b|\bmanaging\b/i],
  ["lead", /\b(lead|principal|staff|architect)\b/i],
  ["senior", /\b(senior|sr\.?)\b/i],
  ["intern", /\b(intern|internship|co-op|trainee|apprentice)\b/i],
  ["entry", /\b(junior|jr\.?|entry[- ]level|associate|graduate|assistant)\b/i],
];

export function detectSeniority(text: string): Seniority | null {
  for (const [level, re] of SENIORITY_PATTERNS) if (re.test(text)) return level;
  return null;
}

/** "5+ years", "at least 3 years", "3-5 years of experience" -> the minimum asked for. */
export function requiredYears(jd: string): number | null {
  const found: number[] = [];
  const re = /(\d{1,2})\s*(?:\+|plus)?\s*(?:-|to|–)?\s*(?:\d{1,2})?\s*\+?\s*(?:years?|yrs?)\b/gi;
  for (const m of jd.matchAll(re)) {
    const n = Number(m[1]);
    if (n > 0 && n <= 30) found.push(n);
  }
  return found.length ? Math.min(...found) : null;
}

const EDU_LEVELS: [string, RegExp, number][] = [
  ["Doctorate", /\b(ph\.?d|doctorate|doctoral)\b/i, 5],
  ["Master's degree", /\b(master'?s|m\.?s\.?|mba|m\.?a\.?)\b/i, 4],
  ["Bachelor's degree", /\b(bachelor'?s|b\.?s\.?|b\.?a\.?|undergraduate degree|4-year degree)\b/i, 3],
  ["Associate degree", /\bassociate'?s? degree\b/i, 2],
  ["High school diploma", /\b(high school|ged)\b/i, 1],
];

function eduLevel(text: string): { name: string; rank: number } | null {
  for (const [name, re, rank] of EDU_LEVELS) if (re.test(text)) return { name, rank };
  return null;
}

/** Split a posting into "required" vs "preferred" parts by common headings. */
function splitRequirements(jd: string): { required: string; preferred: string } {
  const lower = jd.toLowerCase();
  const prefIdx = lower.search(/\b(preferred|nice to have|nice-to-have|bonus|plus(es)?:|desired)\b/);
  if (prefIdx < 0) return { required: jd, preferred: "" };
  return { required: jd.slice(0, prefIdx), preferred: jd.slice(prefIdx) };
}

export function guessJobTitle(jd: string): string {
  const first = jd.split("\n").map((l) => l.trim()).find((l) => l.length > 2 && l.length < 80) ?? "";
  const m = jd.match(/(?:job title|position|role)\s*[:\-]\s*(.+)/i);
  return (m?.[1] ?? first).trim().slice(0, 80);
}

function sectionTexts(r: ResumeContent): Record<string, string> {
  return {
    Summary: `${r.targetRole} ${r.summary}`,
    Experience: r.experience.flatMap((e) => [e.title, e.organization, ...e.bullets]).join(" "),
    Projects: r.projects.flatMap((p) => [p.name, p.role, ...p.bullets]).join(" "),
    Skills: r.skills.join(" , "),
    Education: r.education.flatMap((e) => [e.school, e.credential, e.field, ...e.details]).join(" "),
    Certifications: r.certifications.map((c) => `${c.name} ${c.issuer}`).join(" "),
  };
}

function contains(text: string, term: string): boolean {
  return ` ${tokenize(text).join(" ")} `.includes(` ${term} `);
}

export function candidateYears(r: ResumeContent, now: Date = new Date()): number {
  const months = monthsCovered(
    r.experience.filter((e) => e.kind !== "volunteer").map((e) => ({ start: e.startDate, end: e.endDate, current: e.current })),
    now,
  );
  return Math.round((months / 12) * 10) / 10;
}

export function analyzeFit(r: ResumeContent, jd: string, now: Date = new Date()): JdFit {
  const { required, preferred } = splitRequirements(jd);
  const jobTitle = guessJobTitle(jd);
  const titleTokens = new Set(tokenize(jobTitle));
  const reqTokens = ` ${tokenize(required).join(" ")} `;
  const prefTokens = ` ${tokenize(preferred).join(" ")} `;
  const sections = sectionTexts(r);
  const jdTok = ` ${tokenize(jd).join(" ")} `;

  const keywords: PrioritizedKeyword[] = extractKeywords(jd, 30).map((term) => {
    const mentions = jdTok.split(` ${term} `).length - 1;
    const inTitle = term.split(" ").some((t) => titleTokens.has(t));
    const inRequired = reqTokens.includes(` ${term} `);
    const onlyPreferred = !inRequired && prefTokens.includes(` ${term} `);
    const priority: KeywordPriority = inTitle || (inRequired && mentions >= 2) ? "critical" : onlyPreferred ? "nice" : "important";
    const foundIn = Object.entries(sections)
      .filter(([, text]) => contains(text, term))
      .map(([name]) => name);
    return { term, priority, mentions, foundIn };
  });
  const order: Record<KeywordPriority, number> = { critical: 0, important: 1, nice: 2 };
  keywords.sort((a, b) => order[a.priority] - order[b.priority] || b.mentions - a.mentions);

  const weight: Record<KeywordPriority, number> = { critical: 3, important: 2, nice: 1 };
  const totalW = keywords.reduce((a, k) => a + weight[k.priority], 0);
  const gotW = keywords.reduce((a, k) => a + (k.foundIn.length ? weight[k.priority] : 0), 0);
  // Keywords used in experience bullets count more than ones only listed in skills.
  const inContext = keywords.filter((k) => k.foundIn.some((s) => s === "Experience" || s === "Projects")).length;
  const found = keywords.filter((k) => k.foundIn.length).length;

  const checks: FitCheck[] = [];
  const kwPoints = totalW ? Math.round((gotW / totalW) * 40) : 0;
  checks.push({
    key: "keywords",
    name: "Keyword match (weighted)",
    max: 40,
    points: kwPoints,
    status: kwPoints >= 28 ? "ok" : kwPoints >= 16 ? "partial" : "gap",
    detail: `${found} of ${keywords.length} key terms found. Critical terms count 3×, preferred 1×.`,
  });

  const ctxPoints = found ? Math.round((inContext / found) * 10) : 0;
  checks.push({
    key: "context",
    name: "Keywords shown in context",
    max: 10,
    points: ctxPoints,
    status: ctxPoints >= 7 ? "ok" : ctxPoints >= 4 ? "partial" : "gap",
    detail: `${inContext} of ${found} matched terms appear in an experience or project bullet, not just the skills list.`,
  });

  const reqYears = requiredYears(required) ?? requiredYears(jd);
  const years = candidateYears(r, now);
  const yPoints = reqYears === null ? 15 : years >= reqYears ? 15 : years >= reqYears * 0.7 ? 9 : years > 0 ? 4 : 0;
  checks.push({
    key: "years",
    name: "Experience alignment",
    max: 15,
    points: yPoints,
    status: yPoints >= 15 ? "ok" : yPoints >= 9 ? "partial" : "gap",
    detail:
      reqYears === null
        ? `The posting doesn't state years required. Your resume shows about ${years} years of work.`
        : `Asks for ${reqYears}+ years; your dated work history covers about ${years}.`,
  });

  const jobSeniority = detectSeniority(jobTitle) ?? detectSeniority(required.slice(0, 400));
  const recentTitles = r.experience.filter((e) => e.kind !== "volunteer").slice(0, 2).map((e) => e.title).join(" ");
  const candidateSeniority = detectSeniority(recentTitles) ?? (years >= 6 ? "senior" : years >= 2 ? "mid" : years > 0 ? "entry" : null);
  let sPoints = 15;
  let sDetail = "No seniority level detected in the posting.";
  if (jobSeniority) {
    const diff = SENIORITY_ORDER.indexOf(jobSeniority) - SENIORITY_ORDER.indexOf(candidateSeniority ?? "entry");
    sPoints = diff <= 0 ? 15 : diff === 1 ? 9 : 3;
    sDetail =
      diff <= 0
        ? `The role is ${jobSeniority}-level; your recent titles support that${diff < -1 ? " (you may be overqualified; consider emphasizing hands-on work)" : ""}.`
        : `The role is ${jobSeniority}-level; your recent titles read as ${candidateSeniority ?? "early career"}. Highlight scope: people led, budgets, ownership.`;
  }
  checks.push({ key: "seniority", name: "Seniority fit", max: 15, points: sPoints, status: sPoints >= 15 ? "ok" : sPoints >= 9 ? "partial" : "gap", detail: sDetail });

  const need = eduLevel(required) ?? eduLevel(jd);
  const have = r.education.map((e) => eduLevel(`${e.credential} ${e.field}`)).reduce<{ name: string; rank: number } | null>(
    (best, x) => (x && (!best || x.rank > best.rank) ? x : best),
    null,
  );
  const ePoints = !need ? 10 : have && have.rank >= need.rank ? 10 : have ? 5 : r.education.length ? 5 : 0;
  checks.push({
    key: "education",
    name: "Education requirement",
    max: 10,
    points: ePoints,
    status: ePoints >= 10 ? "ok" : ePoints >= 5 ? "partial" : "gap",
    detail: !need
      ? "No specific degree requirement found."
      : have && have.rank >= need.rank
        ? `Asks for a ${need.name}; your resume shows one.`
        : `Asks for a ${need.name}. ${have ? `Your highest listed is ${have.name}.` : "We couldn't find a matching credential."} Equivalent experience is often accepted; check the posting.`,
  });

  const titleHit = [...titleTokens].filter((t) => t.length > 2).some((t) => contains(`${r.targetRole} ${r.summary} ${recentTitles}`, t));
  checks.push({
    key: "title",
    name: "Job title match",
    max: 10,
    points: titleHit ? 10 : 0,
    status: titleHit ? "ok" : "gap",
    detail: titleHit
      ? `Your target role, summary or recent titles echo "${jobTitle}".`
      : `Neither your summary nor recent titles mention "${jobTitle}". ATS searches often start with the title.`,
  });

  return {
    score: checks.reduce((a, c) => a + c.points, 0),
    checks,
    keywords,
    missingCritical: keywords.filter((k) => k.priority === "critical" && !k.foundIn.length).map((k) => k.term),
    jobTitle,
    requiredYears: reqYears,
    candidateYears: years,
    jobSeniority,
    candidateSeniority,
    requiredEducation: need?.name ?? null,
  };
}
