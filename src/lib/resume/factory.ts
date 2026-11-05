import type {
  Certification,
  Education,
  Experience,
  FactSource,
  Project,
  ResumeContent,
} from "./types";

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function emptyResume(): ResumeContent {
  return {
    targetRole: "",
    contact: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      links: [],
      confirmed: false,
      source: "typed",
    },
    summary: "",
    summaryConfirmed: false,
    experience: [],
    education: [],
    projects: [],
    certifications: [],
    skills: [],
    skillsConfirmed: false,
  };
}

export function newExperience(source: FactSource = "typed", kind: Experience["kind"] = "job"): Experience {
  return {
    id: newId(),
    source,
    confirmed: false,
    confidence: source === "typed" ? "high" : undefined,
    kind,
    title: "",
    organization: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [],
  };
}

export function newEducation(source: FactSource = "typed"): Education {
  return {
    id: newId(),
    source,
    confirmed: false,
    confidence: source === "typed" ? "high" : undefined,
    school: "",
    credential: "",
    field: "",
    startDate: "",
    endDate: "",
    current: false,
    details: [],
  };
}

export function newProject(source: FactSource = "typed"): Project {
  return {
    id: newId(),
    source,
    confirmed: false,
    confidence: source === "typed" ? "high" : undefined,
    name: "",
    role: "",
    link: "",
    bullets: [],
  };
}

export function newCertification(source: FactSource = "typed"): Certification {
  return {
    id: newId(),
    source,
    confirmed: false,
    confidence: source === "typed" ? "high" : undefined,
    name: "",
    issuer: "",
    date: "",
  };
}

/** Fill in any fields missing from older or partial documents. */
export function normalizeResume(input: Partial<ResumeContent> | null | undefined): ResumeContent {
  const base = emptyResume();
  if (!input) return base;
  return {
    ...base,
    ...input,
    contact: { ...base.contact, ...(input.contact ?? {}) },
    experience: input.experience ?? [],
    education: input.education ?? [],
    projects: input.projects ?? [],
    certifications: input.certifications ?? [],
    skills: input.skills ?? [],
  };
}
