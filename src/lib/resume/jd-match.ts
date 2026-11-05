// Compare a resume with a job description using transparent keyword overlap.
// Missing keywords are suggestions to consider only if they are true for the user.

import { resumeText } from "./facts";
import type { ResumeContent } from "./types";

const STOPWORDS = new Set(
  (
    "a about above across after again all also am an and any are as at be because been before being " +
    "below between both but by can could did do does doing down during each etc every few for from " +
    "further had has have having he her here hers him his how i if in into is it its itself just like " +
    "may me might more most must my no nor not now of off on once only or other our ours out over own " +
    "per please same she should so some such than that the their theirs them then there these they " +
    "this those through to too under until up upon us very via was we were what when where which while " +
    "who whom why will with within without would you your yours " +
    // Job-posting filler
    "ability able apply applicant applicants candidate candidates company including job join looking " +
    "opportunity position preferred plus required requirements responsibilities role skills strong team " +
    "work working years year experience excellent good great knowledge understanding environment " +
    "ideal qualifications benefits salary equal employer new using use related across within daily based " +
    "seeking help ensure make well including include includes etc must-have nice-to-have friendly " +
    "duties duty successful familiarity familiar proven"
  ).split(/\s+/),
);

export function tokenize(text: string): string[] {
  return (
    text
      .toLowerCase()
      // keep things like c++, c#, node.js, ci/cd
      .match(/[a-z0-9][a-z0-9+#./-]*[a-z0-9+#]|[a-z0-9]/g) ?? []
  )
    .map((t) => t.replace(/[./-]+$/, ""))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t) && !/^\d+$/.test(t));
}

function phrases(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) out.push(`${tokens[i]} ${tokens[i + 1]}`);
  return out;
}

export type JdMatch = {
  score: number;
  matched: string[];
  missing: string[];
  keywordsConsidered: number;
};

/** Pull the most important terms from a job description (repeated words and phrases first). */
export function extractKeywords(jd: string, limit = 25): string[] {
  const tokens = tokenize(jd);
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const phraseCounts = new Map<string, number>();
  for (const p of phrases(tokens)) phraseCounts.set(p, (phraseCounts.get(p) ?? 0) + 1);

  const repeatedPhrases = [...phraseCounts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([p]) => p);

  const coveredByPhrase = new Set(repeatedPhrases.flatMap((p) => p.split(" ")));
  const words = [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([w]) => w)
    .filter((w) => !coveredByPhrase.has(w) || (counts.get(w) ?? 0) >= 3);

  return [...repeatedPhrases.slice(0, 8), ...words].slice(0, limit);
}

export function matchJobDescription(resume: ResumeContent, jd: string): JdMatch {
  const keywords = extractKeywords(jd);
  if (keywords.length === 0) return { score: 0, matched: [], missing: [], keywordsConsidered: 0 };
  const text = ` ${tokenize(resumeText(resume)).join(" ")} `;
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of keywords) {
    (text.includes(` ${k} `) ? matched : missing).push(k);
  }
  return {
    score: Math.round((matched.length / keywords.length) * 100),
    matched,
    missing,
    keywordsConsidered: keywords.length,
  };
}
