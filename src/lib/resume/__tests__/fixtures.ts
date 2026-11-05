import { emptyResume, newEducation, newExperience } from "../factory";
import type { ResumeContent } from "../types";

export function sampleResume(): ResumeContent {
  const r = emptyResume();
  r.targetRole = "Junior Data Analyst";
  r.contact = {
    fullName: "Jordan Lee",
    email: "jordan@example.com",
    phone: "(555) 123-4567",
    location: "Columbus, OH",
    links: ["linkedin.com/in/jordanlee"],
    confirmed: true,
    source: "typed",
  };
  const job = newExperience();
  Object.assign(job, {
    title: "Data Intern",
    organization: "Acme Corp",
    startDate: "2025-06",
    endDate: "2025-08",
    confirmed: true,
    bullets: [
      "Built 3 Excel dashboards tracking weekly sales for the regional team",
      "Cleaned and merged 12,000 customer records using SQL and Python",
    ],
  });
  const edu = newEducation();
  Object.assign(edu, {
    school: "Ohio State University",
    credential: "B.S.",
    field: "Statistics",
    startDate: "2022-08",
    endDate: "2026-05",
    confirmed: true,
  });
  r.experience = [job];
  r.education = [edu];
  r.skills = ["SQL", "Python", "Excel", "Tableau", "Statistics"];
  r.skillsConfirmed = true;
  return r;
}
