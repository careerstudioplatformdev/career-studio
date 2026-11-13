// Quantifiable contributions (XYZ bullets) and the grounding check that keeps
// AI-written text from introducing numbers the user never gave us.

export type MetricKind = "percent" | "money" | "count" | "time" | "other";

export type Contribution = {
  /** What you did, starting with a verb: "Automated the weekly sales report" */
  action: string;
  /** The measurable result, in the user's words: "cut prep time" */
  result: string;
  /** The number, exactly as the user knows it: "40%", "$12,000", "3 hours a week". Optional. */
  metric: string;
  /** How or with what: "using Excel Power Query" */
  how: string;
  /** Scope or audience: "for a 12-person sales team" */
  scope: string;
};

const clean = (s: string) => s.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "");

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Compose an XYZ bullet: "Accomplished [X] as measured by [Y], by doing [Z]".
 * Uses only what the user typed. Missing parts are simply left out.
 */
export function composeContribution(c: Contribution): string {
  const action = clean(c.action);
  if (!action) return "";
  const result = clean(c.result);
  const metric = clean(c.metric);
  const how = clean(c.how);
  const scope = clean(c.scope);

  let out = capitalize(action);
  if (scope) out += ` ${scope}`;
  if (how) out += `${/^(using|with|by|through|via)\b/i.test(how) ? " " : ", using "}${how}`;
  if (result && metric) out += `, ${result} by ${metric}`;
  else if (result) out += `, ${result}`;
  else if (metric) out += ` (${metric})`;
  return `${out}.`.replace(/\.\.$/, ".");
}

export function hasMetric(bullet: string): boolean {
  return /\d/.test(bullet) || /\b(one|two|three|four|five|six|seven|eight|nine|ten|dozen|hundred|thousand|million|double[sd]?|tripled?|half)\b/i.test(bullet);
}

/** Questions that help someone find (true) numbers for a bullet that has none. */
export function quantifyPrompts(bullet: string): string[] {
  const b = bullet.toLowerCase();
  const prompts: string[] = [];
  if (/\b(customer|client|patient|student|user|guest|caller)s?\b/.test(b)) prompts.push("About how many people did you serve per day, week or month?");
  if (/\b(train|mentor|coach|teach|tutor|supervis|led|lead|manag)/.test(b)) prompts.push("How many people did you train, lead or support?");
  if (/\b(automat|streamlin|improv|reduc|faster|speed|efficien|optimi)/.test(b)) prompts.push("How much time, cost or error did it save? Before vs. after?");
  if (/\b(sales|revenue|budget|fund|raise|cost|sav)/.test(b)) prompts.push("What was the dollar amount or percentage change?");
  if (/\b(project|launch|build|built|develop|creat|design)/.test(b)) prompts.push("How many users, features or deliverables? How long did it take?");
  if (/\b(event|organiz|plan|coordinat)/.test(b)) prompts.push("How many attendees, events or partners were involved?");
  if (prompts.length === 0) prompts.push("How often did you do this, for how many people, or with what result?");
  prompts.push("Only add a number you could explain in an interview. An honest estimate (\"about 30\") is fine.");
  return prompts;
}

/** Numeric tokens in a piece of text, normalized ("$12,000" -> "12000", "40 %" -> "40"). */
export function numbersIn(text: string): string[] {
  return (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((n) => n.replace(/,/g, "").replace(/\.0+$/, ""));
}

/**
 * Numbers that appear in `generated` but nowhere in the user's own source text.
 * Used to block AI from adding achievements, years or figures the user didn't state.
 */
export function unsupportedNumbers(generated: string, sources: string[]): string[] {
  const known = new Set(sources.flatMap(numbersIn));
  return [...new Set(numbersIn(generated).filter((n) => !known.has(n)))];
}
