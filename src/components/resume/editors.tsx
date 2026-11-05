"use client";

import { useState } from "react";
import { Badge, Button, Field, TextArea } from "@/components/ui";
import { isYearOnly } from "@/lib/resume/dates";
import { newCertification, newEducation, newExperience, newProject } from "@/lib/resume/factory";
import type {
  Certification,
  Confirmable,
  Contact,
  Education,
  Experience,
  ExperienceKind,
  Project,
  ResumeContent,
} from "@/lib/resume/types";

type EditorProps = { resume: ResumeContent; onChange: (r: ResumeContent) => void };

/** Editing a fact means it needs confirming again; uploaded facts become "edited". */
function touched<T extends { confirmed: boolean; source: Confirmable["source"] }>(item: T, patch: Partial<T>): T {
  return {
    ...item,
    ...patch,
    confirmed: "confirmed" in patch ? Boolean(patch.confirmed) : false,
    source: item.source === "uploaded" && !("confirmed" in patch) ? "edited" : item.source,
  };
}

export function SourceBadges({ item }: { item: { source: Confirmable["source"]; confidence?: Confirmable["confidence"]; confirmed: boolean } }) {
  return (
    <span className="flex flex-wrap items-center gap-1">
      {item.source === "uploaded" && <Badge tone="brand">From your upload</Badge>}
      {item.source === "edited" && <Badge tone="brand">Edited by you</Badge>}
      {item.source !== "typed" && item.confidence === "low" && <Badge tone="warn">Low confidence: please check</Badge>}
      {item.confirmed ? <Badge tone="ok">Confirmed</Badge> : <Badge tone="warn">Needs your confirmation</Badge>}
    </span>
  );
}

export function ConfirmBox({
  checked,
  onChange,
  label = "I've checked these details and they're accurate",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${checked ? "bg-ok-soft text-ok" : "bg-canvas text-ink"}`}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/** One bullet per line. Keeps blank lines while typing; they're dropped on export. */
function LinesField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <TextArea
      label={label}
      hint={hint ?? "One point per line."}
      value={value.join("\n")}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      rows={Math.max(3, value.length + 1)}
    />
  );
}

function DateFields({
  start,
  end,
  current,
  currentLabel,
  onChange,
}: {
  start: string;
  end: string;
  current: boolean;
  currentLabel: string;
  onChange: (p: { startDate?: string; endDate?: string; current?: boolean }) => void;
}) {
  const yearNote = (v: string) => (isYearOnly(v) ? `Your file says ${v}. Add the month if you know it, or leave it.` : undefined);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Field label="Start (month)" type="month" value={isYearOnly(start) ? "" : start} hint={yearNote(start)} onChange={(e) => onChange({ startDate: e.target.value || start })} />
      <Field
        label="End (month)"
        type="month"
        value={current || isYearOnly(end) ? "" : end}
        hint={current ? undefined : yearNote(end)}
        disabled={current}
        onChange={(e) => onChange({ endDate: e.target.value || end })}
      />
      <label className="flex items-end gap-2 pb-2 text-sm text-ink">
        <input type="checkbox" checked={current} onChange={(e) => onChange({ current: e.target.checked })} />
        {currentLabel}
      </label>
    </div>
  );
}

function EntryShell({
  title,
  item,
  onRemove,
  onConfirm,
  children,
}: {
  title: string;
  item: Confirmable;
  onRemove: () => void;
  onConfirm: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div id={`entry-${item.id}`} className="rounded-xl border border-line bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-medium text-ink">{title}</h4>
        <div className="flex items-center gap-2">
          <SourceBadges item={item} />
          <Button variant="ghost" size="sm" onClick={onRemove} aria-label={`Remove ${title}`}>
            Remove
          </Button>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
      <ConfirmBox checked={item.confirmed} onChange={onConfirm} />
    </div>
  );
}

// ---------- Target role & contact ----------

export function TargetRoleEditor({ resume, onChange }: EditorProps) {
  return (
    <Field
      label="What kind of job are you aiming for?"
      placeholder="e.g. Customer Service Representative, Junior Data Analyst"
      value={resume.targetRole}
      onChange={(e) => onChange({ ...resume, targetRole: e.target.value })}
      hint="It's fine to be broad. You can tailor it later for each job."
    />
  );
}

export function ContactEditor({ resume, onChange }: EditorProps) {
  const c = resume.contact;
  const set = (patch: Partial<Contact>) => onChange({ ...resume, contact: touched(c, patch) });
  return (
    <div className="space-y-3">
      <div className="flex justify-end"><SourceBadges item={c} /></div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Full name" autoComplete="name" value={c.fullName} onChange={(e) => set({ fullName: e.target.value })} />
        <Field label="Email" type="email" autoComplete="email" value={c.email} onChange={(e) => set({ email: e.target.value })} />
        <Field label="Phone" type="tel" autoComplete="tel" value={c.phone} onChange={(e) => set({ phone: e.target.value })} />
        <Field label="City, State" placeholder="e.g. Columbus, OH" value={c.location} onChange={(e) => set({ location: e.target.value })} hint="No street address needed." />
      </div>
      <LinesField label="Links (optional)" hint="LinkedIn, portfolio or GitHub. One per line." value={c.links} onChange={(links) => set({ links })} />
      <ConfirmBox checked={c.confirmed} onChange={(v) => set({ confirmed: v })} />
    </div>
  );
}

// ---------- Experience ----------

const KIND_LABEL: Record<ExperienceKind, string> = {
  job: "Job",
  internship: "Internship",
  volunteer: "Volunteering",
  freelance: "Freelance / self-employed",
};

export function ExperienceEditor({
  resume,
  onChange,
  kinds = ["job", "internship", "freelance"],
  addLabel = "Add a job or internship",
}: EditorProps & { kinds?: ExperienceKind[]; addLabel?: string }) {
  const items = resume.experience.filter((e) => kinds.includes(e.kind));
  const update = (id: string, patch: Partial<Experience>) =>
    onChange({ ...resume, experience: resume.experience.map((e) => (e.id === id ? touched(e, patch) : e)) });

  return (
    <div className="space-y-4">
      {items.map((e) => (
        <EntryShell
          key={e.id}
          title={[e.title, e.organization].filter(Boolean).join(" · ") || KIND_LABEL[e.kind]}
          item={e}
          onRemove={() => onChange({ ...resume, experience: resume.experience.filter((x) => x.id !== e.id) })}
          onConfirm={(v) => update(e.id, { confirmed: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={e.kind === "volunteer" ? "Role" : "Job title"} value={e.title} onChange={(ev) => update(e.id, { title: ev.target.value })} />
            <Field label="Organization" value={e.organization} onChange={(ev) => update(e.id, { organization: ev.target.value })} />
            <Field label="Location (optional)" value={e.location} onChange={(ev) => update(e.id, { location: ev.target.value })} />
            {kinds.length > 1 && (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-ink">Type</span>
                <select
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm"
                  value={e.kind}
                  onChange={(ev) => update(e.id, { kind: ev.target.value as ExperienceKind })}
                >
                  {kinds.map((k) => (
                    <option key={k} value={k}>{KIND_LABEL[k]}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <DateFields
            start={e.startDate}
            end={e.endDate}
            current={e.current}
            currentLabel="I still do this"
            onChange={(p) => update(e.id, p)}
          />
          <LinesField
            label="What did you do?"
            hint="One point per line. Start with a verb (Helped, Built, Organized). Only include numbers you can back up."
            placeholder={"Helped 40+ customers a day find products and resolve issues\nTrained 3 new team members on opening procedures"}
            value={e.bullets}
            onChange={(bullets) => update(e.id, { bullets })}
          />
        </EntryShell>
      ))}
      <Button variant="secondary" onClick={() => onChange({ ...resume, experience: [...resume.experience, newExperience("typed", kinds[0])] })}>
        + {addLabel}
      </Button>
    </div>
  );
}

// ---------- Education ----------

export function EducationEditor({ resume, onChange }: EditorProps) {
  const update = (id: string, patch: Partial<Education>) =>
    onChange({ ...resume, education: resume.education.map((e) => (e.id === id ? touched(e, patch) : e)) });
  return (
    <div className="space-y-4">
      {resume.education.map((e) => (
        <EntryShell
          key={e.id}
          title={e.school || "School"}
          item={e}
          onRemove={() => onChange({ ...resume, education: resume.education.filter((x) => x.id !== e.id) })}
          onConfirm={(v) => update(e.id, { confirmed: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="School" value={e.school} onChange={(ev) => update(e.id, { school: ev.target.value })} />
            <Field label="Degree or credential" placeholder="e.g. High School Diploma, B.S., Certificate" value={e.credential} onChange={(ev) => update(e.id, { credential: ev.target.value })} />
            <Field label="Field of study (optional)" value={e.field} onChange={(ev) => update(e.id, { field: ev.target.value })} />
          </div>
          <DateFields start={e.startDate} end={e.endDate} current={e.current} currentLabel="Still studying" onChange={(p) => update(e.id, p)} />
          <LinesField
            label="Highlights (optional)"
            hint="Relevant coursework, honors, GPA if 3.5+, activities. One per line."
            value={e.details}
            onChange={(details) => update(e.id, { details })}
          />
        </EntryShell>
      ))}
      <Button variant="secondary" onClick={() => onChange({ ...resume, education: [...resume.education, newEducation()] })}>
        + Add school or training
      </Button>
    </div>
  );
}

// ---------- Projects ----------

export function ProjectsEditor({ resume, onChange }: EditorProps) {
  const update = (id: string, patch: Partial<Project>) =>
    onChange({ ...resume, projects: resume.projects.map((p) => (p.id === id ? touched(p, patch) : p)) });
  return (
    <div className="space-y-4">
      {resume.projects.map((p) => (
        <EntryShell
          key={p.id}
          title={p.name || "Project"}
          item={p}
          onRemove={() => onChange({ ...resume, projects: resume.projects.filter((x) => x.id !== p.id) })}
          onConfirm={(v) => update(p.id, { confirmed: v })}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Project name" value={p.name} onChange={(ev) => update(p.id, { name: ev.target.value })} />
            <Field label="Your role (optional)" placeholder="e.g. Team lead, Solo project" value={p.role} onChange={(ev) => update(p.id, { role: ev.target.value })} />
            <Field label="Link (optional)" value={p.link} onChange={(ev) => update(p.id, { link: ev.target.value })} />
          </div>
          <LinesField
            label="What did you do and what came of it?"
            placeholder={"Designed a budgeting app in Python used by 5 classmates\nPresented findings to a class of 30"}
            value={p.bullets}
            onChange={(bullets) => update(p.id, { bullets })}
          />
        </EntryShell>
      ))}
      <Button variant="secondary" onClick={() => onChange({ ...resume, projects: [...resume.projects, newProject()] })}>
        + Add a project
      </Button>
    </div>
  );
}

// ---------- Certifications ----------

export function CertificationsEditor({ resume, onChange }: EditorProps) {
  const update = (id: string, patch: Partial<Certification>) =>
    onChange({ ...resume, certifications: resume.certifications.map((c) => (c.id === id ? touched(c, patch) : c)) });
  return (
    <div className="space-y-4">
      {resume.certifications.map((c) => (
        <EntryShell
          key={c.id}
          title={c.name || "Certification"}
          item={c}
          onRemove={() => onChange({ ...resume, certifications: resume.certifications.filter((x) => x.id !== c.id) })}
          onConfirm={(v) => update(c.id, { confirmed: v })}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Name" value={c.name} onChange={(ev) => update(c.id, { name: ev.target.value })} />
            <Field label="Issued by" value={c.issuer} onChange={(ev) => update(c.id, { issuer: ev.target.value })} />
            <Field label="Date (month)" type="month" value={c.date} onChange={(ev) => update(c.id, { date: ev.target.value })} />
          </div>
        </EntryShell>
      ))}
      <Button variant="secondary" onClick={() => onChange({ ...resume, certifications: [...resume.certifications, newCertification()] })}>
        + Add a certification or license
      </Button>
    </div>
  );
}

// ---------- Skills & summary ----------

export function SkillsEditor({ resume, onChange }: EditorProps) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const items = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (!items.length) return;
    onChange({ ...resume, skills: [...new Set([...resume.skills, ...items])], skillsConfirmed: false });
    setDraft("");
  };
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        {resume.skills.length > 0 &&
          (resume.skillsConfirmed ? <Badge tone="ok">Confirmed</Badge> : <Badge tone="warn">Needs your confirmation</Badge>)}
      </div>
      <div className="flex gap-2">
        <Field
          className="flex-1"
          label="Add skills"
          placeholder="e.g. Microsoft Excel, Spanish, Customer service"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          hint="Separate with commas. Only list skills you could talk about in an interview."
        />
        <Button variant="secondary" className="mt-6 self-start" onClick={add}>Add</Button>
      </div>
      {resume.skills.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Your skills">
          {resume.skills.map((s) => (
            <li key={s} className="flex items-center gap-1 rounded-full border border-line bg-white py-1 pl-3 pr-1 text-sm">
              {s}
              <button
                type="button"
                className="grid h-5 w-5 place-items-center rounded-full text-muted hover:bg-black/5 hover:text-ink"
                aria-label={`Remove ${s}`}
                onClick={() => onChange({ ...resume, skills: resume.skills.filter((x) => x !== s), skillsConfirmed: false })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {resume.skills.length > 0 && (
        <ConfirmBox
          checked={resume.skillsConfirmed}
          onChange={(v) => onChange({ ...resume, skillsConfirmed: v })}
          label="These are skills I genuinely have"
        />
      )}
    </div>
  );
}

export function SummaryEditor({ resume, onChange }: EditorProps) {
  const words = resume.summary.trim().split(/\s+/).filter(Boolean).length;
  return (
    <div>
      <TextArea
        label="Summary (optional)"
        placeholder="e.g. Reliable retail team member with two years of customer service experience, now looking for an entry-level office role."
        value={resume.summary}
        onChange={(e) => onChange({ ...resume, summary: e.target.value, summaryConfirmed: false })}
        hint={`2–3 sentences about who you are and what you're looking for. ${words} words${words > 80 ? " (try to keep it under 80)" : ""}.`}
      />
      {resume.summary.trim() && (
        <ConfirmBox checked={resume.summaryConfirmed} onChange={(v) => onChange({ ...resume, summaryConfirmed: v })} />
      )}
    </div>
  );
}
