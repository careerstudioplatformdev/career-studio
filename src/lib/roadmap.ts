// Career Studio master blueprint (v7.0), refined into a build roadmap.
// Status reflects what is actually shipped in this app, not plans.

export type FeatureStatus = "live" | "partial" | "next" | "later";

export type RoadmapFeature = { name: string; status: FeatureStatus; detail: string };

export type RoadmapModule = {
  number: number;
  name: string;
  goal: string;
  features: RoadmapFeature[];
};

export const STATUS_TEXT: Record<FeatureStatus, string> = {
  live: "Live",
  partial: "Early version",
  next: "Up next",
  later: "Planned",
};

export const MODULES: RoadmapModule[] = [
  {
    number: 1,
    name: "AI Resume Studio",
    goal: "Anyone, with no resume knowledge, can build, check and improve a best-in-class resume, and every fact stays true.",
    features: [
      { name: "Create my first resume from your story", status: "live", detail: "Tell your story in your own words; an AI career coach drafts the resume and asks adaptive follow-up questions one at a time." },
      { name: "Guided step-by-step form", status: "live", detail: "A no-AI path whose questions adapt to experience level (student, some experience, experienced)." },
      { name: "Upload and improve an existing resume", status: "live", detail: "PDF or Word; every extracted detail is labeled and must be confirmed." },
      { name: "Best-in-class sections", status: "live", detail: "Summary, skills, experience, education, certifications, projects and volunteering in a recruiter-standard order." },
      { name: "Seven-agent architecture", status: "live", detail: "3 builders (recruiter, ATS, achievement), 3 reviewers (ATS, readability, factual accuracy) and a final approval agent that recommends the strongest version." },
      { name: "Never-invent guardrail", status: "live", detail: "AI text containing numbers or dates the user never gave is blocked automatically; AI-drafted items are labeled and need confirmation." },
      { name: "Measurable contributions (XYZ bullets)", status: "live", detail: "Guided builder for action + scope + method + result, plus questions that help people find honest numbers." },
      { name: "Red flags", status: "live", detail: "Gaps, overlaps, date errors, vague duty bullets, missing results, clichés, tense, job-hopping pattern, contact issues, unreviewed AI text." },
      { name: "Recruiter Gaze F-Scan", status: "live", detail: "Scores the top band, second sweep and left edge, with a gaze overlay on the preview." },
      { name: "Resume length control (1–5 pages)", status: "live", detail: "Trims lower-priority detail to fit, explains what was shortened, and never pads." },
      { name: "Quality score", status: "live", detail: "Transparent 100-point checklist covering contact, sections, bullets, impact, dates and readability." },
      { name: "Resume-based interview Q&A", status: "live", detail: "Questions from your own bullets, skills and gaps; AI feedback on practice answers; 15–90 minute timed sessions." },
      { name: "Word and PDF export", status: "live", detail: "ATS-friendly single-column files, only after every fact is confirmed and attested." },
      { name: "Resume versioning", status: "partial", detail: "Snapshots on export and before applying AI versions; tailored copies link to their original." },
      { name: "ATS format options", status: "next", detail: "Alternative ATS-safe layouts (e.g. skills-first, two-line headers)." },
      { name: "Voice conversation", status: "later", detail: "Talk to the career coach instead of typing." },
    ],
  },
  {
    number: 2,
    name: "AI Job Agent",
    goal: "Find the right jobs, fit the resume to each, and apply with the candidate's approval.",
    features: [
      { name: "Fit your resume to a job description", status: "live", detail: "Explainable ATS match score: weighted keywords, keywords in context, experience years, seniority, education and title match." },
      { name: "Keyword prioritization", status: "live", detail: "Critical, important and nice-to-have terms, where each appears in your resume, and one-click \"I have this\"." },
      { name: "AI tailoring and cover letter", status: "live", detail: "Rewrites that surface keywords your experience already supports, yes/no questions for missing ones, and a grounded cover letter." },
      { name: "Tailored resume copies", status: "live", detail: "One click saves a job-specific copy, reordered for relevance, linked to an application." },
      { name: "Application tracker", status: "live", detail: "Saved → tailoring → ready → applied → interviewing → offer, with notes and an apply kit." },
      { name: "Candidate-approved apply", status: "live", detail: "A checklist (approved resume, posting link) then you approve; we open the employer's page and record it. Nothing is submitted for you." },
      { name: "Outcome patterns", status: "partial", detail: "Simple insights such as match scores of interviews vs. rejections." },
      { name: "Job discovery and recommendations", status: "next", detail: "Search permitted job sources and rank by explainable match." },
      { name: "One-click submission via permitted integrations", status: "later", detail: "Only through platforms that allow it, and only after explicit per-application approval." },
    ],
  },
  {
    number: 3,
    name: "Networking & Referrals",
    goal: "Build relationships, not just applications.",
    features: [
      { name: "Outreach and referral message drafts", status: "next", detail: "Personalized LinkedIn, introduction and follow-up drafts the candidate sends themselves." },
      { name: "Networking tracker", status: "later", detail: "Track conversations and follow-ups." },
      { name: "Contact and referral discovery", status: "later", detail: "Requires permitted data sources." },
    ],
  },
  {
    number: 4,
    name: "Professional Profile Alignment",
    goal: "One consistent professional story across resume and LinkedIn.",
    features: [
      { name: "Resume-to-LinkedIn comparison", status: "next", detail: "Paste your profile to find inconsistencies in titles, dates, skills and positioning." },
      { name: "Headline and About recommendations", status: "next", detail: "Grounded in confirmed resume facts." },
    ],
  },
  {
    number: 5,
    name: "AI Interview Simulator",
    goal: "Practice for the real interview for the real job.",
    features: [
      { name: "Resume- and job-based questions with feedback", status: "partial", detail: "Live in Resume Studio's Interview prep tab." },
      { name: "Multi-turn mock interviews with follow-ups", status: "next", detail: "HR, technical, behavioral, hiring-manager and panel formats with a readiness report." },
      { name: "Voice interviews", status: "later", detail: "Spoken practice." },
    ],
  },
  {
    number: 6,
    name: "Peer & Expert Resume Reviews",
    goal: "Combine AI evaluation with human judgment.",
    features: [
      { name: "Private, invitation-based peer reviews", status: "next", detail: "Candidate-controlled access and structured feedback." },
      { name: "Paid expert reviews", status: "later", detail: "Through Stripe once pricing is set." },
    ],
  },
  {
    number: 7,
    name: "Career Studio Verified",
    goal: "Optionally show evidence of skills, not just claims.",
    features: [
      { name: "100-point assessment framework", status: "later", detail: "Resume quality 15, skills 35, problem solving 25, communication 15, evidence 10, only after proper validation." },
      { name: "Candidate-controlled badges", status: "later", detail: "Never described as verified until validated." },
    ],
  },
  {
    number: 8,
    name: "Career Studio Connect",
    goal: "Connect candidates with verified employers and hiring events.",
    features: [
      { name: "Employer registration and verification", status: "later", detail: "" },
      { name: "Hiring events and candidate discovery", status: "later", detail: "Candidate opt-in only." },
    ],
  },
];

export const PLATFORM: RoadmapFeature[] = [
  { name: "Career dashboard", status: "partial", detail: "Resumes and applications today; interviews and progress later." },
  { name: "Privacy controls", status: "live", detail: "Download all data, delete account, per-row access controls, no file storage for uploads." },
  { name: "Notifications, calendar, SMS, WhatsApp", status: "later", detail: "Planned, not integrated." },
  { name: "Payments (Stripe)", status: "later", detail: "Pricing under consideration ($9.99 per resume or $19.99 monthly were discussed)." },
];
