"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { Button, Card, CheckIcon, Eyebrow, Notice, StepProgress } from "@/components/ui";
import { pendingConfirmations } from "@/lib/resume/facts";
import type { ExperienceLevel, ResumeContent } from "@/lib/resume/types";
import {
  CertificationsEditor,
  ContactEditor,
  EducationEditor,
  ExperienceEditor,
  ProjectsEditor,
  SkillsEditor,
  SummaryEditor,
  TargetRoleEditor,
} from "./editors";
import { RedFlags, ResumePreview } from "./panels";
import { useAiEnabled } from "./ai";
import { StoryBuilder } from "./story-builder";
import { SaveIndicator, useResume } from "./use-resume";

type Step = {
  key: string;
  title: string;
  intro: string;
  prompts?: string[];
  optional?: boolean;
  render: (r: ResumeContent, set: (r: ResumeContent) => void) => ReactNode;
};

const STEP_LIBRARY: Record<string, Omit<Step, "key">> = {
  target: {
    title: "What are you aiming for?",
    intro: "Knowing your goal helps us suggest what to highlight.",
    render: (r, set) => <TargetRoleEditor resume={r} onChange={set} />,
  },
  contact: {
    title: "How can employers reach you?",
    intro: "Use a professional email you check often.",
    render: (r, set) => <ContactEditor resume={r} onChange={set} />,
  },
  education: {
    title: "Tell us about your education",
    intro: "Include high school, college, bootcamps or training programs, finished or in progress.",
    prompts: ["Any classes related to the job you want?", "Honors, awards, clubs or teams?", "Big school projects you're proud of?"],
    render: (r, set) => <EducationEditor resume={r} onChange={set} />,
  },
  experience: {
    title: "Where have you worked?",
    intro: "Paid jobs, internships, part-time and gig work all count.",
    prompts: [
      "What were your main tasks on a typical day?",
      "What tools, software or equipment did you use?",
      "Did anything improve because of your work? Only add numbers you know are accurate.",
    ],
    render: (r, set) => <ExperienceEditor resume={r} onChange={set} />,
  },
  firstExperience: {
    title: "Any work experience, even informal?",
    intro: "Part-time jobs, babysitting, family business, gig work or internships all count. Skip if none.",
    optional: true,
    prompts: ["Who did you help, and how?", "What were you trusted to handle?", "What did you learn to do well?"],
    render: (r, set) => <ExperienceEditor resume={r} onChange={set} addLabel="Add work experience" />,
  },
  projects: {
    title: "Projects you've worked on",
    intro: "School, personal or team projects show what you can do, especially early in your career.",
    optional: true,
    prompts: ["What problem did it solve?", "What was your part in it?", "What was the result?"],
    render: (r, set) => <ProjectsEditor resume={r} onChange={set} />,
  },
  volunteer: {
    title: "Volunteering and community work",
    intro: "Unpaid roles build real skills. Add them if you have any.",
    optional: true,
    render: (r, set) => <ExperienceEditor resume={r} onChange={set} kinds={["volunteer"]} addLabel="Add volunteering" />,
  },
  certifications: {
    title: "Certifications and licenses",
    intro: "For example: CPR, ServSafe, forklift, CompTIA, Google certificates.",
    optional: true,
    render: (r, set) => <CertificationsEditor resume={r} onChange={set} />,
  },
  skills: {
    title: "What are you good at?",
    intro: "Mix practical skills (software, tools, languages) with strengths you can give examples of.",
    render: (r, set) => <SkillsEditor resume={r} onChange={set} />,
  },
  summary: {
    title: "Introduce yourself",
    intro: "A short summary at the top. Optional, but helpful if you're changing careers or just starting out.",
    optional: true,
    render: (r, set) => <SummaryEditor resume={r} onChange={set} />,
  },
};

const ORDERS: Record<ExperienceLevel, string[]> = {
  none: ["target", "contact", "education", "projects", "firstExperience", "volunteer", "certifications", "skills", "summary"],
  some: ["target", "contact", "experience", "education", "projects", "volunteer", "certifications", "skills", "summary"],
  experienced: ["target", "contact", "experience", "education", "certifications", "skills", "summary", "projects", "volunteer"],
};

const LEVELS: { value: ExperienceLevel; title: string; body: string }[] = [
  { value: "none", title: "I'm just starting out", body: "Student, recent graduate, or no formal jobs yet." },
  { value: "some", title: "I have some experience", body: "A few jobs, internships or part-time roles." },
  { value: "experienced", title: "I've worked for several years", body: "Changing careers or returning to work counts too." },
];

export function Builder({ id }: { id: string }) {
  const router = useRouter();
  const { row, loadError, saveStatus, setContent, setQaState, flush } = useResume(id);
  const aiEnabled = useAiEnabled();

  const steps = useMemo<Step[]>(() => {
    const level = row?.qa_state.experienceLevel ?? "some";
    return [...ORDERS[level].map((k) => ({ key: k, ...STEP_LIBRARY[k] })), {
      key: "review",
      title: "Review and confirm",
      intro: "Check each item. Nothing goes on your final resume until you've confirmed it.",
      render: () => null,
    }];
  }, [row?.qa_state.experienceLevel]);

  if (loadError) return <div className="mx-auto max-w-3xl px-6 py-10"><Notice tone="bad">{loadError}</Notice></div>;
  if (!row) return <div className="mx-auto max-w-3xl px-6 py-10 text-muted">Loading your resume…</div>;

  const mode = row.qa_state.mode ?? (!row.qa_state.step || row.qa_state.step === "level" ? "story" : "guided");
  if (mode === "story") {
    return (
      <StoryBuilder id={id} row={row} saveStatus={saveStatus} setContent={setContent} setQaState={setQaState} flush={flush} aiEnabled={aiEnabled} />
    );
  }

  const r = row.content;
  const stepKey = row.qa_state.step ?? "level";
  const index = steps.findIndex((s) => s.key === stepKey);
  const step = index >= 0 ? steps[index] : null;

  const go = (key: string) => {
    setQaState({ ...row.qa_state, step: key });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function finish() {
    setQaState({ ...row!.qa_state, step: "review", completed: true });
    await flush();
    router.push(`/resumes/${id}`);
  }

  // First question: experience level, which decides the order of everything else.
  if (stepKey === "level" || !step) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Eyebrow>Let&apos;s build your resume</Eyebrow>
        <h1 className="mt-1 text-[30px] font-semibold text-ink sm:text-[36px]">How much work experience do you have?</h1>
        <p className="mt-1 text-muted">We&apos;ll adjust the questions to fit. There&apos;s no wrong answer.</p>
        {aiEnabled && (
          <p className="mt-2 text-sm">
            <button type="button" className="font-medium text-orange-ink underline underline-offset-2" onClick={() => setQaState({ ...row.qa_state, mode: "story" })}>
              Or tell us your story and let the AI coach draft it →
            </button>
          </p>
        )}
        <div className="mt-6 grid gap-3">
          {LEVELS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => setQaState({ ...row.qa_state, experienceLevel: l.value, step: ORDERS[l.value][0] })}
              aria-pressed={row.qa_state.experienceLevel === l.value}
              className={`flex min-h-11 items-start justify-between gap-3 rounded-xl p-4 text-left transition ${row.qa_state.experienceLevel === l.value ? "border-[1.5px] border-ink bg-grey-50" : "border border-hairline bg-white hover:border-grey-400"}`}
            >
              <span>
                <span className="block font-semibold text-ink">{l.title}</span>
                <span className="block text-sm text-muted">{l.body}</span>
              </span>
              {row.qa_state.experienceLevel === l.value && <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-ink" />}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const pending = pendingConfirmations(r);

  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-muted">Step {index + 1} of {steps.length}</span>
          <SaveIndicator status={saveStatus} />
        </div>
        <div className="mb-6">
          <StepProgress current={index + 1} total={steps.length} />
        </div>

        <h1 className="text-[30px] font-semibold text-ink sm:text-[36px]">{step.title}</h1>
        <p className="mt-1 text-muted">{step.intro}</p>

        {step.prompts && (
          <Card className="mt-4 bg-grey-100">
            <p className="text-sm font-medium text-ink">Questions to think about</p>
            <ul className="mt-1 list-disc pl-5 text-sm text-muted">
              {step.prompts.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Card>
        )}

        <div className="mt-6">
          {step.key === "review" ? (
            <ReviewStep resume={r} onChange={setContent} pendingCount={pending.length} />
          ) : (
            step.render(r, setContent)
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <Button variant="ghost" onClick={() => go(index > 0 ? steps[index - 1].key : "level")}>← Back</Button>
          <div className="flex gap-2">
            {step.key !== "review" && step.optional && (
              <Button variant="ghost" onClick={() => go(steps[index + 1].key)}>Skip for now</Button>
            )}
            {step.key === "review" ? (
              <Button onClick={finish}>Open in Resume Studio →</Button>
            ) : (
              <Button onClick={() => go(steps[index + 1].key)}>Continue →</Button>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">
          Your answers save automatically. <Link href="/dashboard" className="underline">Leave and come back later</Link>.
        </p>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Your resume</h2>
          <span className="text-xs text-muted">{pending.length} to confirm</span>
        </div>
        <ResumePreview resume={r} />
        <nav aria-label="Sections" className="mt-4 flex flex-wrap gap-1">
          {steps.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => go(s.key)}
              aria-current={i === index ? "step" : undefined}
              className={`min-h-11 rounded-full px-3.5 text-[13px] ${i === index ? "border-[1.5px] border-ink bg-grey-50 font-semibold text-ink" : "border border-hairline bg-white text-grey-600 hover:text-ink"}`}
            >
              {STEP_SHORT[s.key] ?? s.title}
            </button>
          ))}
        </nav>
      </aside>
    </div>
  );
}

const STEP_SHORT: Record<string, string> = {
  target: "Goal",
  contact: "Contact",
  education: "Education",
  experience: "Work",
  firstExperience: "Work",
  projects: "Projects",
  volunteer: "Volunteering",
  certifications: "Certifications",
  skills: "Skills",
  summary: "Summary",
  review: "Review",
};

function ReviewStep({ resume, onChange, pendingCount }: { resume: ResumeContent; onChange: (r: ResumeContent) => void; pendingCount: number }) {
  return (
    <div className="space-y-6">
      {pendingCount > 0 ? (
        <Notice tone="warn">{pendingCount} item{pendingCount > 1 ? "s" : ""} still need your confirmation. Tick the box under each one once it&apos;s correct.</Notice>
      ) : (
        <Notice tone="ok">Everything is confirmed. Open Resume Studio to check your score and download.</Notice>
      )}
      <RedFlags resume={resume} />
      <Section title="Contact"><ContactEditor resume={resume} onChange={onChange} /></Section>
      {resume.experience.some((e) => e.kind !== "volunteer") && (
        <Section title="Work"><ExperienceEditor resume={resume} onChange={onChange} /></Section>
      )}
      {resume.education.length > 0 && <Section title="Education"><EducationEditor resume={resume} onChange={onChange} /></Section>}
      {resume.projects.length > 0 && <Section title="Projects"><ProjectsEditor resume={resume} onChange={onChange} /></Section>}
      {resume.experience.some((e) => e.kind === "volunteer") && (
        <Section title="Volunteering"><ExperienceEditor resume={resume} onChange={onChange} kinds={["volunteer"]} addLabel="Add volunteering" /></Section>
      )}
      {resume.certifications.length > 0 && <Section title="Certifications"><CertificationsEditor resume={resume} onChange={onChange} /></Section>}
      <Section title="Skills"><SkillsEditor resume={resume} onChange={onChange} /></Section>
      {resume.summary.trim() && <Section title="Summary"><SummaryEditor resume={resume} onChange={onChange} /></Section>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
