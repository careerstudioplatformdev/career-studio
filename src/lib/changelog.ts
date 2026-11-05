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
