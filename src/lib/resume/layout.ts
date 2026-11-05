// Shared single-column layout used by the preview, DOCX and PDF exports,
// so all three always show the same content in the same order.

import { formatMonth, formatRange } from "./dates";
import type { ResumeContent } from "./types";

export type LayoutEntry = {
  heading: string;
  subheading: string;
  dates: string;
  bullets: string[];
};

export type LayoutSection = {
  title: string;
  entries?: LayoutEntry[];
  text?: string;
};

export type ResumeLayout = {
  name: string;
  contactLine: string;
  sections: LayoutSection[];
};

const clean = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);

export function buildLayout(r: ResumeContent): ResumeLayout {
  const c = r.contact;
  const sections: LayoutSection[] = [];

  if (r.summary.trim()) sections.push({ title: "Summary", text: r.summary.trim() });

  const work = r.experience.filter((e) => e.kind !== "volunteer");
  const volunteer = r.experience.filter((e) => e.kind === "volunteer");
  const toEntry = (e: (typeof r.experience)[number]): LayoutEntry => ({
    heading: e.title.trim(),
    subheading: clean([e.organization, e.location]).join(", "),
    dates: formatRange(e.startDate, e.endDate, e.current),
    bullets: clean(e.bullets),
  });

  if (work.length) sections.push({ title: "Experience", entries: work.map(toEntry) });

  if (r.projects.length) {
    sections.push({
      title: "Projects",
      entries: r.projects.map((p) => ({
        heading: p.name.trim(),
        subheading: clean([p.role, p.link]).join(", "),
        dates: "",
        bullets: clean(p.bullets),
      })),
    });
  }

  if (r.education.length) {
    sections.push({
      title: "Education",
      entries: r.education.map((e) => ({
        heading: e.school.trim(),
        subheading: clean([e.credential, e.field]).join(", "),
        dates: formatRange(e.startDate, e.endDate, e.current),
        bullets: clean(e.details),
      })),
    });
  }

  if (volunteer.length) sections.push({ title: "Volunteering", entries: volunteer.map(toEntry) });

  if (r.certifications.length) {
    sections.push({
      title: "Certifications",
      entries: r.certifications.map((x) => ({
        heading: x.name.trim(),
        subheading: x.issuer.trim(),
        dates: formatMonth(x.date),
        bullets: [],
      })),
    });
  }

  if (r.skills.length) sections.push({ title: "Skills", text: clean(r.skills).join(", ") });

  return {
    name: c.fullName.trim(),
    contactLine: clean([c.location, c.phone, c.email, ...c.links]).join(" | "),
    sections,
  };
}

export function fileBaseName(r: ResumeContent): string {
  const name = r.contact.fullName.trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
  return name ? `${name}_Resume` : "Resume";
}
