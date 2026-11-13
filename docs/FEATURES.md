# Career Studio: Refined Feature List

Master blueprint: **Version 7.0 (November 13, 2026)**, Agentic AI Career Operating System.
This document refines the blueprint into what to build, in what order, and how it should feel to use.
The in-app version is at `/roadmap` (source: `src/lib/roadmap.ts`).

**Product philosophy:** help a person build a career, not merely a resume.
Build → Optimize → Find jobs → Apply → Network → Prepare for interviews → Connect with employers → Get hired.

**Non-negotiable rule:** the AI never invents facts. Unknown stays empty. Every entry records its source
(typed, uploaded, edited, AI-drafted) and must be confirmed by the user. Export requires every fact confirmed
plus a final attestation. AI output containing numbers or dates the user never stated is removed automatically.

---

## Delivery order

| Stage | What | Status |
|---|---|---|
| 1. Create | Story-first conversational resume builder (Module 1) | **Live (v0.4.0)** |
| 2. Validate | Seven-agent review, factual guardrails, editing and approval | **Live (v0.4.0)** |
| 3. Optimize | Red flags, F-Scan, quantified contributions, 1–5 page control, interview Q&A | **Live (v0.4.0)** |
| 4. Fit to a job | ATS match, keyword priority, alignment checks, AI tailoring, tailored copies | **Live (v0.4.0)** |
| 5. Apply | Candidate-approved applications and tracker (Module 2) | **Live (v0.4.0)**, no automatic submission |
| 6+ | Modules 3–8 | Planned |

AI features need `ANTHROPIC_API_KEY` set in Vercel. Without it the app falls back to the guided form and rule-based checks.

---

## Module 1: AI Resume Studio

### 1A. Create my first resume (story-first)

The seamless path for someone who has never written a resume.

1. **Open Career Studio → "Create my first resume".**
2. **Tell your story.** One big, friendly text box: "Write the way you'd talk to a friend." Optional idea list
   (target job, school, every job or volunteer role, projects, tools, certifications, things that improved because of you).
   Target job and desired length (1–5 pages) are asked up front.
3. **AI career coach drafts the resume** from the story and shows it live beside the conversation.
4. **Adaptive follow-up questions, one at a time,** in plain language. Students get questions about projects,
   coursework, internships, volunteering and transferable skills; experienced people about scope, outcomes and promotions.
   Each question says why it's asked. Users can skip any question.
5. **Coach stops when there's enough** (about 15 questions max) and hands off to review.
6. **Review and confirm:** every AI-drafted entry is labeled and must be confirmed.
7. Progress saves automatically; users can leave and resume.
8. **Fallback:** a guided step-by-step form whose question order adapts to experience level (no AI needed).

### 1B. Upload my existing resume
PDF/DOCX parsing in memory (file never stored), every extracted detail labeled with confidence and confirmed.

### 1C. Best-in-class resume content
Sections in recruiter-standard order: contact, **summary**, **experience**, projects, **education**, volunteering,
**certifications**, **skills**. Achievement-style bullets (action + what + result), past tense for past roles,
no first person, single-column ATS-safe layout.

### 1D. Seven-agent resume architecture

| Agent | Responsibility |
|---|---|
| Builder 1 | Recruiter-focused version (outcome-first, skimmable) |
| Builder 2 | ATS-focused version (standard, searchable terminology) |
| Builder 3 | Achievement-focused version (XYZ bullets where results were given) |
| Reviewer 1 | ATS compatibility and keyword coverage |
| Reviewer 2 | Recruiter readability and presentation |
| Reviewer 3 | Factual accuracy against the user's own words, relevance, weaknesses |
| Final Approval | Picks the strongest, fixes reviewer issues, explains why |

Builders run in parallel, then reviewers in parallel, then the approver. Every version is sanitized server-side
(only existing entries, only existing skills, no unsupported numbers). The user compares versions with scores,
applies one (snapshot + undo), and re-confirms changed items.

### 1E. Improvement features

| Feature | What the user gets |
|---|---|
| **Resume length (1–5 pages)** | Exact page fitting using the PDF's own layout engine; trims lower-priority detail (older bullets first, then education details, projects, volunteering); explains what was shortened; never pads; recommends a length from years of experience; page numbers on multi-page PDFs. |
| **Red flags** | Timeline (gaps, overlaps, date errors, duplicates), wording (duty-style bullets, clichés, first person, over-long or repetitive bullets), evidence (roles with no measurable results, skills never shown, unreviewed AI text), consistency (tense, short-tenure pattern, summary vs target role), contact (unprofessional email, full street address, social links). Grouped by type and severity. |
| **Measurable contributions** | Guided XYZ builder (what you did, for whom, how, result, the number) that composes a bullet from the user's words only, plus per-bullet questions that help find honest numbers. |
| **Recruiter Gaze F-Scan** | Scores the top band (name, contact, first summary line naming the role and keywords), the second sweep (most recent title, employer, dates high on the page), the left edge (first words of bullets: verbs, keywords, no filler) and headings, with a gaze overlay on the preview. |
| **Resume-based interview Q&A** | Questions drawn from the user's own bullets, skills and gaps (plus AI questions from resume + job), tips for strong answers, AI feedback scored on relevance, STAR structure, specificity and communication, a stronger-answer outline with [brackets] for unknowns, and 15/30/45/60/90-minute timed sessions. |
| **Quality score** | Transparent 100-point checklist. |
| **Export** | Word and PDF after full confirmation and attestation; approved snapshots kept. |

---

## Module 1 → 2 bridge: Fit your resume to a job description

Explainable ATS match report (every point traceable to a rule):

| Check | Points |
|---|---|
| Weighted keyword match (critical 3×, important 2×, preferred 1×) | 40 |
| Keywords shown in context (in bullets, not just skills) | 10 |
| Experience alignment (years required vs dated history) | 15 |
| Seniority fit (intern → executive) | 15 |
| Education requirement | 10 |
| Job title match | 10 |

Plus: keyword prioritization table with where each term appears, "I have this" (adds to skills for confirmation),
"put the most relevant points first" (reorders, never rewrites), AI tailoring suggestions grounded in existing bullets,
yes/no questions for missing keywords, a cover letter draft, before/after score comparison, and
**save as a tailored copy** linked to an application.

---

## Module 2: AI Job Agent (candidate-approved apply)

- Save jobs (title, company, link, description, resume) with an automatic match score.
- Pipeline: saved → tailoring → ready → applied → interviewing → offer / not selected / withdrawn.
- Apply kit per job: tailored resume, cover letter, notes, approval checklist (approved resume, posting link).
- **Approve & open application:** the user approves, we open the employer's page and record the date. Nothing is submitted for them.
- Outcome patterns (e.g. match scores of interviews vs rejections, missing cover letters).
- Next: job discovery from permitted sources, explainable recommendations.
- Later: one-click submission only through platforms that permit it, with per-application approval.

## Modules 3–8 (planned, unchanged from blueprint)

3. **Networking & Referrals:** outreach and referral drafts the user sends; networking tracker.
4. **Professional Profile Alignment:** resume-to-LinkedIn comparison, headline/About recommendations.
5. **AI Interview Simulator:** multi-turn mock interviews (HR, technical, behavioral, hiring manager, panel), readiness report, voice later.
6. **Peer & Expert Reviews:** private invitation-based reviews first; paid expert reviews via Stripe later.
7. **Career Studio Verified:** 100-point framework (resume 15, skills 35, problem solving 25, communication 15, evidence 10), only after validation.
8. **Career Studio Connect:** employer verification, hiring events, opt-in candidate discovery.

## Platform

Dashboard (resumes + applications), privacy controls (data download, account deletion, RLS on every table),
resume versioning, AI daily allowance per user (`AI_DAILY_LIMIT`), Stripe payments (pricing TBD),
notifications/calendar/SMS/WhatsApp/voice (later).

## Architecture (as built)

Next.js 16 on Vercel; Supabase (Postgres + Auth, RLS everywhere); Claude via the Anthropic SDK with structured
outputs and server-side fallbacks (`src/lib/ai/`); pure, unit-tested resume logic in `src/lib/resume/`.
This replaces the blueprint's Django/LangGraph/Celery/DigitalOcean proposal with fewer moving parts and lower hosting cost.
