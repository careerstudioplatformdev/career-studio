// Structured resume document. Every entry records where it came from and whether
// the user has confirmed it. Unknown details stay empty; we never fill them in.

export type FactSource = "typed" | "uploaded" | "edited";

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
};

export type QaState = {
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
  origin: "qa" | "upload";
  content: ResumeContent;
  qa_state: QaState;
  status: "draft" | "approved";
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};
