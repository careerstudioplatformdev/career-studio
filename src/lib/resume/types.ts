// Structured resume document. Every entry records where it came from and whether
// the user has confirmed it. Unknown details stay empty; we never fill them in.

/**
 * typed: the user wrote it. uploaded: pulled from their file. edited: uploaded, then changed.
 * ai: drafted by the AI from the user's own words (story or answers). Always unconfirmed at first.
 */
export type FactSource = "typed" | "uploaded" | "edited" | "ai";

export type Confirmable = {
  id: string;
  source: FactSource;
  confirmed: boolean;
  /** Parser confidence for uploaded entries. Typed entries are "high". */
  confidence?: "high" | "medium" | "low";
};

export type ExperienceKind = "job" | "internship" | "volunteer" | "freelance";

export type Experience = Confirmable & {
  kind: ExperienceKind;
  title: string;
  organization: string;
  location: string;
  /** "YYYY-MM" or "" when unknown */
  startDate: string;
  /** "YYYY-MM", "" when unknown; ignored when current is true */
  endDate: string;
  current: boolean;
  bullets: string[];
};

export type Education = Confirmable & {
  school: string;
  credential: string;
  field: string;
  startDate: string;
  endDate: string;
  current: boolean;
  details: string[];
};

export type Project = Confirmable & {
  name: string;
  role: string;
  link: string;
  bullets: string[];
};

export type Certification = Confirmable & {
  name: string;
  issuer: string;
  date: string;
};

export type Contact = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
  confirmed: boolean;
  source: FactSource;
};

export type ExperienceLevel = "none" | "some" | "experienced";

export type ResumeContent = {
  targetRole: string;
  contact: Contact;
  summary: string;
  summaryConfirmed: boolean;
  experience: Experience[];
  education: Education[];
  projects: Project[];
  certifications: Certification[];
  skills: string[];
  skillsConfirmed: boolean;
  /** Desired length in pages, 1–5. Content is never padded; only trimmed to fit. */
  pageTarget: PageTarget;
};

export type PageTarget = 1 | 2 | 3 | 4 | 5;

export type ChatTurn = { role: "coach" | "user"; text: string; why?: string };

export type QaState = {
  /** "story": AI-assisted, starts from the user's personal story. "guided": step-by-step forms. */
  mode?: "story" | "guided";
  /** The user's own words. The AI may only draw facts from this and their answers. */
  story?: string;
  chat?: ChatTurn[];
  /** The job description the user is currently fitting this resume to. */
  jobDescription?: string;
  step?: string;
  experienceLevel?: ExperienceLevel;
  completed?: boolean;
  /** Upload only: lines the parser couldn't place, and parser warnings. */
  unplaced?: string[];
  warnings?: string[];
};

export type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  origin: "qa" | "upload" | "tailored";
  parent_id: string | null;
  content: ResumeContent;
  qa_state: QaState;
  status: "draft" | "approved";
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
