// Heuristic resume text parser. It only copies what is in the text; anything it
// can't place goes to `unplaced` for the user to review. All entries start
// unconfirmed, with a confidence rating, so the user checks them before export.

import { parseLooseDate } from "./dates";
import { emptyResume, newCertification, newEducation, newExperience, newProject } from "./factory";
import type { Experience, ResumeContent } from "./types";

export type ParseResult = {
  resume: ResumeContent;
  /** Lines we couldn't confidently place in a section. */
  unplaced: string[];
  warnings: string[];
};

type SectionKey = "summary" | "experience" | "education" | "projects" | "skills" | "certifications" | "volunteer";

const HEADINGS: [SectionKey, RegExp][] = [
  ["summary", /^(professional\s+)?(summary|profile|objective|about me)$/],
  ["experience", /^(work\s+|professional\s+|relevant\s+)?(experience|employment|work history|employment history)$/],
  ["volunteer", /^(volunteer(ing)?|volunteer experience|community (service|involvement))$/],
  ["education", /^(education|academic background|education and training)$/],
  ["projects", /^(projects|personal projects|academic projects|selected projects)$/],
  ["skills", /^(skills|technical skills|core skills|key skills|skills and abilities|competencies)$/],
  ["certifications", /^(certifications?|licenses?( and certifications?)?|certificates?)$/],
];

const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE = `(?:${MONTH}\\.?\\s+\\d{4}|\\d{1,2}\\s*/\\s*\\d{4}|\\d{4})`;
const RANGE_RE = new RegExp(`(${DATE})\\s*(?:-|–|—|to)\\s*(${DATE}|present|current|now)`, "i");
const BULLET_RE = /^\s*(?:[-•*·▪●◦‣–]|\d+[.)])\s+/;

function headingFor(line: string): SectionKey | null {
  const clean = line.toLowerCase().replace(/[:\s]+$/, "").replace(/\s+/g, " ").trim();
  if (clean.length > 40) return null;
  for (const [key, re] of HEADINGS) if (re.test(clean)) return key;
  return null;
}

function extractRange(line: string) {
  const m = line.match(RANGE_RE);
  if (!m) return null;
  const start = parseLooseDate(m[1]);
  const endRaw = m[2].toLowerCase();
  const current = ["present", "current", "now"].includes(endRaw);
  const end = current ? { value: "", precise: true } : parseLooseDate(m[2]);
  return {
    match: m[0],
    startDate: start.value,
    endDate: end.value,
    current,
    precise: start.precise && end.precise,
  };
}

function splitTitleOrg(text: string): { title: string; organization: string; location: string } {
  const cleaned = text.replace(/\s*[|,–—-]\s*$/, "").trim();
  const at = cleaned.match(/^(.*?)\s+at\s+(.*)$/i);
  if (at) return { title: at[1].trim(), organization: at[2].trim(), location: "" };
  const parts = cleaned.split(/\s*(?:\||—|–|\s-\s|,)\s*/).filter(Boolean);
  return {
    title: parts[0] ?? "",
    organization: parts[1] ?? "",
    location: parts.slice(2).join(", "),
  };
}

export function parseResumeText(raw: string): ParseResult {
  const resume = emptyResume();
  const unplaced: string[] = [];
  const warnings: string[] = [];
  const lines = raw
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { resume, unplaced, warnings: ["We couldn't find any text in this file."] };
  }

  // Contact details from the whole document.
  const all = lines.join("\n");
  const email = all.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = all.match(/(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] ?? "";
  const links = [...new Set(all.match(/(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com|github\.com)\/[^\s|,]+/gi) ?? [])];
  resume.contact = {
    fullName: "",
    email,
    phone,
    location: "",
    links,
    confirmed: false,
    source: "uploaded",
  };

  // Header: lines before the first section heading.
  let i = 0;
  const header: string[] = [];
  while (i < lines.length && !headingFor(lines[i])) header.push(lines[i++]);
  const nameLine = header.find((l) => !l.includes("@") && !/\d{3}/.test(l) && l.split(" ").length <= 5);
  if (nameLine) resume.contact.fullName = nameLine;
  const locLine = header.find((l) => /\b[A-Z][a-zA-Z .]+,\s*[A-Z]{2}\b/.test(l));
  if (locLine) {
    resume.contact.location = locLine.match(/\b[A-Z][a-zA-Z .]+,\s*[A-Z]{2}\b/)?.[0]?.trim() ?? "";
  }
  if (!resume.contact.fullName) warnings.push("We couldn't find your name. Please add it.");

  let section: SectionKey | null = null;
  let currentExp: Experience | null = null;
  let currentEdu: ReturnType<typeof newEducation> | null = null;
  let currentProj: ReturnType<typeof newProject> | null = null;
  const summaryLines: string[] = [];

  const finishEntries = () => {
    currentExp = null;
    currentEdu = null;
    currentProj = null;
  };

  for (; i < lines.length; i++) {
    const line = lines[i];
    const h = headingFor(line);
    if (h) {
      section = h;
      finishEntries();
      continue;
    }
    const isBullet = BULLET_RE.test(line);
    const text = line.replace(BULLET_RE, "").trim();

    switch (section) {
      case "summary":
        summaryLines.push(text);
        break;

      case "experience":
      case "volunteer": {
        const range = extractRange(text);
        if (range && !isBullet) {
          const rest = text.replace(range.match, "").trim();
          const exp = newExperience("uploaded", section === "volunteer" ? "volunteer" : "job");
          const parts = splitTitleOrg(rest);
          // Sometimes title/org is on the previous non-bullet line.
          if (!parts.title && i > 0 && !BULLET_RE.test(lines[i - 1]) && !headingFor(lines[i - 1])) {
            Object.assign(exp, splitTitleOrg(lines[i - 1]));
          } else {
            Object.assign(exp, parts);
          }
          if (/intern/i.test(exp.title)) exp.kind = "internship";
          exp.startDate = range.startDate;
          exp.endDate = range.endDate;
          exp.current = range.current;
          exp.confidence = exp.title && exp.organization && range.precise ? "medium" : "low";
          resume.experience.push(exp);
          currentExp = exp;
        } else if (currentExp && (isBullet || text.length > 40)) {
          (currentExp as Experience).bullets.push(text);
        } else if (!isBullet && lines[i + 1] && extractRange(lines[i + 1]) && !splitTitleOrg(lines[i + 1].replace(RANGE_RE, "")).title) {
          // Title line followed by a dates-only line; handled on the next iteration.
        } else {
          unplaced.push(text);
        }
        break;
      }

      case "education": {
        const range = extractRange(text);
        const looksLikeSchool = /(university|college|institute|school|academy)/i.test(text);
        if (!isBullet && (looksLikeSchool || (range && !currentEdu))) {
          const edu = newEducation("uploaded");
          const withoutRange = range ? text.replace(range.match, "").trim() : text;
          const parts = withoutRange.split(/\s*(?:\||—|–|\s-\s|,)\s*/).filter(Boolean);
          const schoolIdx = parts.findIndex((p) => /(university|college|institute|school|academy)/i.test(p));
          edu.school = schoolIdx >= 0 ? parts[schoolIdx] : parts[0] ?? "";
          const others = parts.filter((_, k) => k !== (schoolIdx >= 0 ? schoolIdx : 0));
          edu.credential = others[0] ?? "";
          edu.field = others[1] ?? "";
          if (range) {
            edu.startDate = range.startDate;
            edu.endDate = range.endDate;
            edu.current = range.current;
          } else {
            const year = text.match(/\b(19|20)\d{2}\b/)?.[0];
            if (year) edu.endDate = year;
          }
          edu.confidence = edu.school && (edu.credential || range) ? "medium" : "low";
          resume.education.push(edu);
          currentEdu = edu;
        } else if (currentEdu && !currentEdu.credential && /(bachelor|master|associate|b\.?s\.?|b\.?a\.?|m\.?s\.?|diploma|certificate|ged)/i.test(text)) {
          currentEdu.credential = text;
        } else if (currentEdu) {
          currentEdu.details.push(text);
        } else {
          unplaced.push(text);
        }
        break;
      }

      case "projects": {
        if (!isBullet) {
          const proj = newProject("uploaded");
          const parts = text.split(/\s*(?:\||—|–|\s-\s)\s*/).filter(Boolean);
          proj.name = parts[0] ?? text;
          proj.role = parts[1] ?? "";
          proj.link = text.match(/https?:\/\/\S+/)?.[0] ?? "";
          proj.confidence = "medium";
          resume.projects.push(proj);
          currentProj = proj;
        } else if (currentProj) {
          currentProj.bullets.push(text);
        } else {
          unplaced.push(text);
        }
        break;
      }

      case "skills": {
        const items = text
          .replace(/^[A-Za-z &]+:\s*/, "")
          .split(/\s*[,;|•·]\s*/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.length <= 40);
        resume.skills.push(...items);
        break;
      }

      case "certifications": {
        const cert = newCertification("uploaded");
        const parts = text.split(/\s*(?:\||—|–|\s-\s|,)\s*/).filter(Boolean);
        cert.name = parts[0] ?? text;
        cert.issuer = parts[1] ?? "";
        const d = text.match(new RegExp(DATE, "i"))?.[0];
        cert.date = d ? parseLooseDate(d).value : "";
        cert.confidence = "medium";
        resume.certifications.push(cert);
        break;
      }

      default:
        unplaced.push(text);
    }
  }

  resume.summary = summaryLines.join(" ");
  resume.skills = [...new Set(resume.skills)];

  if (resume.experience.length === 0 && resume.education.length === 0 && resume.projects.length === 0) {
    warnings.push("We couldn't recognize experience or education sections. Please review and add them.");
  }
  const low = [...resume.experience, ...resume.education].filter((e) => e.confidence === "low").length;
  if (low > 0) warnings.push(`${low} ${low === 1 ? "entry needs" : "entries need"} a closer look (marked low confidence).`);

  return { resume, unplaced, warnings };
}
