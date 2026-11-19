"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, buttonClass, Card, Field, Notice, selectClass, TextArea } from "@/components/ui";
import {
  STATUSES,
  STATUS_LABEL,
  approvalChecklist,
  isSafeUrl,
  outcomeInsights,
  type Application,
  type ApplicationStatus,
} from "@/lib/applications";
import { normalizeResume } from "@/lib/resume/factory";
import { analyzeFit, guessJobTitle } from "@/lib/resume/jd-fit";
import type { ResumeContent } from "@/lib/resume/types";
import { createClient } from "@/lib/supabase/client";

type ResumeLite = { id: string; title: string; status: string; origin: string; content: ResumeContent; qa_state: Record<string, unknown> };

export function ApplicationsBoard() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [apps, setApps] = useState<Application[] | null>(null);
  const [resumes, setResumes] = useState<ResumeLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ApplicationStatus | "all">("all");
  const [adding, setAdding] = useState(false);

  const load = useCallback(
    () =>
      Promise.all([
        supabase.from("job_applications").select("*").order("updated_at", { ascending: false }),
        supabase.from("resumes").select("id, title, status, origin, content, qa_state").order("updated_at", { ascending: false }),
      ]).then(([a, r]) => {
        if (a.error || r.error) return setError((a.error ?? r.error)!.message);
        setApps(a.data as Application[]);
        setResumes((r.data ?? []).map((x) => ({ ...x, content: normalizeResume(x.content) })) as ResumeLite[]);
      }),
    [supabase],
  );

  useEffect(() => {
    load();
  }, [load]);

  const byId = useMemo(() => new Map(resumes.map((r) => [r.id, r])), [resumes]);
  const insights = useMemo(() => (apps ? outcomeInsights(apps) : []), [apps]);

  async function update(id: string, patch: Partial<Application>) {
    setApps((xs) => xs?.map((a) => (a.id === id ? { ...a, ...patch } : a)) ?? xs);
    const { error: e } = await supabase.from("job_applications").update(patch).eq("id", id);
    if (e) setError(e.message);
  }

  async function remove(id: string) {
    if (!window.confirm("Remove this application from your tracker?")) return;
    setApps((xs) => xs?.filter((a) => a.id !== id) ?? xs);
    await supabase.from("job_applications").delete().eq("id", id);
  }

  async function tailor(app: Application) {
    const resume = app.resume_id ? byId.get(app.resume_id) : null;
    if (!resume) return setError("Attach a resume first.");
    // Load the job into that resume's "Fit to a job" tab.
    await supabase.from("resumes").update({ qa_state: { ...resume.qa_state, jobDescription: app.description } }).eq("id", resume.id);
    router.push(`/resumes/${resume.id}?tab=fit&app=${app.id}`);
  }

  async function approve(app: Application) {
    if (!isSafeUrl(app.job_url)) return;
    const ok = window.confirm(
      `Approve your application to ${app.job_title || "this job"}${app.company ? ` at ${app.company}` : ""}?\n\nWe'll open the employer's page so you can submit it yourself, and mark it as applied.`,
    );
    if (!ok) return;
    const now = new Date().toISOString();
    window.open(app.job_url, "_blank", "noopener,noreferrer");
    await update(app.id, { approved_at: now, applied_at: now, status: "applied" });
    await supabase.from("audit_events").insert({ resume_id: app.resume_id, action: "application_approved", details: { application_id: app.id } });
  }

  const shown = apps?.filter((a) => filter === "all" || a.status === filter) ?? [];
  const counts = Object.fromEntries(STATUSES.map((s) => [s, apps?.filter((a) => a.status === s).length ?? 0]));

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[30px] font-semibold text-ink sm:text-[36px]">Applications</h1>
          <p className="text-muted">Save jobs, tailor a resume for each, approve, apply, and track what happens.</p>
        </div>
        <Button onClick={() => setAdding((v) => !v)}>{adding ? "Close" : "+ Add a job"}</Button>
      </div>

      <div className="mt-4">
        <Notice tone="info">
          <strong>You stay in control.</strong> Career Studio prepares a tailored resume, cover letter and checklist for each job; you
          approve every application and submit it on the employer&apos;s site. We never apply on your behalf. One-click submission will
          only come through job platforms that allow it, and only with your permission.
        </Notice>
      </div>

      {error && <div className="mt-4"><Notice tone="bad">{error}</Notice></div>}

      {adding && (
        <AddJob
          resumes={resumes}
          onAdded={async () => {
            setAdding(false);
            await load();
          }}
          onError={setError}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-1" role="tablist" aria-label="Filter by status">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>All ({apps?.length ?? 0})</FilterChip>
        {STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
            {STATUS_LABEL[s]} ({counts[s]})
          </FilterChip>
        ))}
      </div>

      {insights.length > 0 && (
        <Card className="mt-4">
          <h2 className="font-semibold text-ink">Patterns so far</h2>
          <ul className="mt-1 list-disc pl-5 text-sm text-muted">{insights.map((i) => <li key={i}>{i}</li>)}</ul>
        </Card>
      )}

      {apps === null ? (
        <p className="mt-6 text-muted">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="mt-6 text-muted">No applications yet. Add a job you&apos;re interested in to get started.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((a) => (
            <li key={a.id}>
              <AppCard
                app={a}
                resume={a.resume_id ? byId.get(a.resume_id) ?? null : null}
                resumes={resumes}
                onUpdate={(p) => update(a.id, p)}
                onRemove={() => remove(a.id)}
                onTailor={() => tailor(a)}
                onApprove={() => approve(a)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm ${active ? "border-[1.5px] border-ink bg-grey-50 font-semibold text-ink" : "border border-hairline bg-white text-grey-700 hover:border-grey-400"}`}
    >
      {children}
    </button>
  );
}

function AddJob({ resumes, onAdded, onError }: { resumes: ResumeLite[]; onAdded: () => void; onError: (e: string) => void }) {
  const [supabase] = useState(() => createClient());
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [jd, setJd] = useState("");
  const [resumeId, setResumeId] = useState(resumes.find((r) => r.origin !== "tailored")?.id ?? "");
  const [busy, setBusy] = useState(false);
  const resume = resumes.find((r) => r.id === resumeId);
  const score = resume && jd.trim().length > 40 ? analyzeFit(resume.content, jd).score : null;

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("job_applications").insert({
      company: company.trim(),
      job_title: title.trim() || (jd ? guessJobTitle(jd) : ""),
      job_url: isSafeUrl(url.trim()) ? url.trim() : "",
      description: jd.slice(0, 20000),
      resume_id: resumeId || null,
      match_score: score,
      status: "saved",
    });
    setBusy(false);
    if (error) return onError(error.message);
    onAdded();
  }

  return (
    <Card className="mt-4 space-y-3">
      <h2 className="font-semibold text-ink">Add a job</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Job title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Field label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
        <Field label="Link to the posting" type="url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} hint={url && !isSafeUrl(url) ? "Enter a full link starting with https://" : undefined} />
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-grey-700">Resume to use</span>
          <select className={selectClass} value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            <option value="">None yet</option>
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </label>
      </div>
      <TextArea label="Job description" rows={6} maxLength={20000} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the posting so we can score your fit and tailor your resume." />
      {score !== null && <p className="text-sm">ATS match with &quot;{resume?.title}&quot;: <strong>{score}/100</strong></p>}
      <Button disabled={busy || (!title.trim() && !jd.trim())} onClick={save}>{busy ? "Saving…" : "Save job"}</Button>
    </Card>
  );
}

function AppCard({
  app,
  resume,
  resumes,
  onUpdate,
  onRemove,
  onTailor,
  onApprove,
}: {
  app: Application;
  resume: ResumeLite | null;
  resumes: ResumeLite[];
  onUpdate: (p: Partial<Application>) => void;
  onRemove: () => void;
  onTailor: () => void;
  onApprove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState(app.cover_letter);
  const [notes, setNotes] = useState(app.notes);
  const checks = approvalChecklist(app, resume);
  const canApprove = checks.every((c) => c.ok) && !app.applied_at;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{app.job_title || "Untitled job"}{app.company && <span className="font-normal text-muted"> · {app.company}</span>}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            {app.match_score !== null && <Badge tone={app.match_score >= 75 ? "ok" : app.match_score >= 50 ? "warn" : "bad"}>Match {app.match_score}</Badge>}
            {resume ? <Link href={`/resumes/${resume.id}`} className="font-medium text-orange-ink underline underline-offset-2">{resume.title}</Link> : <span className="text-muted">No resume attached</span>}
            {app.applied_at && <span className="text-muted">Applied {new Date(app.applied_at).toLocaleDateString()}</span>}
          </div>
        </div>
        <select
          aria-label="Status"
          className={`${selectClass} w-auto`}
          value={app.status}
          onChange={(e) => onUpdate({ status: e.target.value as ApplicationStatus })}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onTailor} disabled={!resume || !app.description}>Tailor resume</Button>
        {app.job_url && isSafeUrl(app.job_url) && (
          <a href={app.job_url} target="_blank" rel="noopener noreferrer" className={buttonClass("ghost", "sm")}>View posting ↗</a>
        )}
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>{open ? "Hide apply kit" : "Apply kit"}</Button>
        <Button size="sm" onClick={onApprove} disabled={!canApprove}>{app.applied_at ? "Approved ✓" : "Approve & open application"}</Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div>
            <h4 className="text-sm font-semibold">Before you approve</h4>
            <ul className="mt-1 space-y-1 text-sm">
              {checks.map((c) => (
                <li key={c.label} className="flex gap-2">
                  <span aria-hidden className={c.ok ? "text-ok" : "text-warn"}>{c.ok ? "✓" : "○"}</span>
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-grey-700">Resume</span>
            <select
              className={selectClass}
              value={app.resume_id ?? ""}
              onChange={(e) => onUpdate({ resume_id: e.target.value || null })}
            >
              <option value="">None</option>
              {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}{r.status === "approved" ? " (approved)" : ""}</option>)}
            </select>
          </label>
          <Field label="Link to the posting" type="url" defaultValue={app.job_url} onBlur={(e) => onUpdate({ job_url: isSafeUrl(e.target.value.trim()) ? e.target.value.trim() : "" })} />
          <TextArea
            label="Cover letter"
            rows={6}
            value={letter}
            onChange={(e) => setLetter(e.target.value)}
            onBlur={() => letter !== app.cover_letter && onUpdate({ cover_letter: letter })}
            hint='Draft one from "Tailor resume" → Fit to a job → Get suggestions, then paste and edit it here.'
          />
          <TextArea label="Notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={() => notes !== app.notes && onUpdate({ notes })} hint="Contacts, interview dates, follow-ups." />
          <Button size="sm" variant="ghost" className="text-bad" onClick={onRemove}>Remove from tracker</Button>
        </div>
      )}
    </Card>
  );
}
