// Release notes shown on the "What's new" page. Newest first.
// Add an entry here with every deploy that changes what people see or can do.

export type Release = {
  version: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  added?: string[];
  improved?: string[];
  fixed?: string[];
};

export const RELEASES: Release[] = [
  {
    version: "0.4.2",
    date: "2026-11-19",
    title: "Easier sign-up and password reset",
    summary: "Sign-up now tells you clearly when you already have an account, and you can reset a forgotten password.",
    added: [
      "\"Forgot password?\" on the log-in page, with an email link to choose a new password.",
      "A \"Resend email\" button after sign-up, plus a reminder to check spam.",
    ],
    fixed: [
      "Signing up with an email that already has an account used to say \"check your inbox\" even though no email was sent. It now explains that you already have an account and offers log in or password reset.",
      "Expired or already-used email links now show a clear message instead of a blank log-in page.",
    ],
  },
  {
    version: "0.4.1",
    date: "2026-11-19",
    title: "A calmer, cleaner look",
    summary: "Career Studio has a new look: mostly white, grey for structure, and a small orange signal that shows where you are and what to do next.",
    improved: [
      "New logo: a segmented line that stands for \"one question at a time\".",
      "Clearer headings in Inter Tight, and calmer black buttons with larger, easier-to-tap targets.",
      "Step-by-step progress shows one segment per question, with your current step in orange.",
      "Your live resume preview now sits in its own framed panel beside each question.",
      "Selected options show a check mark and a dark outline, so they don't rely on color alone.",
      "Links and small tags use a darker orange that's easier to read.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-11-13",
    title: "Your AI career coach, seven-agent review and job applications",
    summary:
      "Create your first resume by telling your story: an AI career coach drafts it and asks follow-up questions one at a time. Then improve it with a seven-agent review, fit it to any job, track applications you approve, and practice interview questions from your own resume.",
    added: [
      "Tell your story: write about yourself in your own words and the AI coach turns it into a resume draft, then asks adaptive follow-up questions one at a time.",
      "Seven-agent review: three builder agents (recruiter, ATS, achievement), three review agents (ATS & keywords, readability, factual accuracy) and a final approval agent recommend the strongest version. You compare and choose, with undo.",
      "Never-invent guardrail: AI suggestions with numbers or dates you never gave are left out automatically, and AI-drafted items are labeled until you confirm them.",
      "Measurable contribution builder for achievement (XYZ) bullets, plus questions that help you find honest numbers.",
      "Recruiter Gaze F-Scan score with a gaze overlay on the preview.",
      "Resume length from 1 to 5 pages: we trim lower-priority detail to fit and tell you what was shortened. Multi-page PDFs get page numbers.",
      "Fit to a job: an explainable ATS match score with weighted keywords, experience, seniority, education and title checks, plus AI tailoring suggestions and a cover letter draft.",
      "Save a tailored copy of your resume for a specific job.",
      "Applications tracker: save jobs, tailor, approve and open each application yourself, and track it from applied to offer. Nothing is ever submitted for you.",
      "Interview prep: questions drawn from your resume (and the job), AI feedback on practice answers, and 15–90 minute timed sessions.",
      "A Roadmap page showing all eight Career Studio modules and what's live.",
    ],
    improved: [
      "Red flags now also catch vague duty bullets, missing results, clichés, tense mistakes, short-tenure patterns, unprofessional contact details and unreviewed AI text, grouped by type.",
      "The guided step-by-step form is still available if you prefer not to use AI.",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-11-05",
    title: "What's new page",
    summary: "You can now see what changed in each version, right from the top menu.",
    added: ["A \"What's new\" link in the top menu, showing changes since the last version and the full history."],
    fixed: ["On phones, the top menu links were cut off at the right edge. They now wrap onto a second line."],
  },
  {
    version: "0.2.0",
    date: "2026-11-05",
    title: "Resume Studio alpha",
    summary: "The first working version of Resume Studio: build a first resume with guided questions, or upload an existing one, then check, improve and download it.",
    added: [
      "Sign up and log in, with privacy consent recorded at sign-up.",
      "Guided questions for building a first resume. The order adapts to how much experience you have, and answers save automatically so you can come back later.",
      "Upload a PDF or Word resume. Details are pulled out for you to check, and the file itself isn't stored.",
      "Every detail must be confirmed before you can download, and uploaded details are clearly labeled.",
      "A transparent quality score out of 100, plus warnings about date errors, gaps and overlaps.",
      "Compare your resume with a job posting to see which key terms it covers.",
      "Download clean, single-column PDF and Word files that applicant tracking systems can read.",
      "Account page: download all your data, or delete your account.",
    ],
    fixed: ["Dates that only list a year (like \"2019\") stay as a year instead of gaining a made-up month."],
  },
  {
    version: "0.1.0",
    date: "2026-11-05",
    title: "Project setup",
    summary: "Connected GitHub, Vercel, Supabase and Stripe (test mode), and set up automatic deploys.",
  },
];

export const CURRENT_RELEASE = RELEASES[0];

export function formatReleaseDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
