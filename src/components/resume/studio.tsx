"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, Notice, buttonClass } from "@/components/ui";
import { pendingConfirmations } from "@/lib/resume/facts";
import { scoreResume } from "@/lib/resume/quality";
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
import { ExportPanel, JdMatchPanel, QualityPanel, ResumePreview } from "./panels";
import { SaveIndicator, useResume } from "./use-resume";

type Tab = "edit" | "check" | "match" | "export";
const TABS: { key: Tab; label: string }[] = [
  { key: "edit", label: "Edit & confirm" },
  { key: "check", label: "Quality check" },
  { key: "match", label: "Match a job" },
  { key: "export", label: "Download" },
];

export function Studio({ id }: { id: string }) {
  const router = useRouter();
  const { row, loadError, saveStatus, setContent, setTitle, flush, markApproved, supabase } = useResume(id);
  const [tab, setTab] = useState<Tab>("edit");
  const [showUnplaced, setShowUnplaced] = useState(true);

  if (loadError) return <div className="mx-auto max-w-3xl px-4 py-10"><Notice tone="bad">{loadError}</Notice></div>;
  if (!row) return <div className="mx-auto max-w-3xl px-4 py-10 text-muted">Loading your resume…</div>;

  const r = row.content;
  const pending = pendingConfirmations(r);
  const score = scoreResume(r).score;

  const jump = (_section: string, entryId: string) => {
    setTab("edit");
    setTimeout(() => {
      const el = document.getElementById(entryId === "contact" ? "section-contact" : entryId === "skills" ? "section-skills" : entryId === "summary" ? "section-summary" : `entry-${entryId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  async function remove() {
    if (!window.confirm("Delete this resume and its saved versions permanently?")) return;
    await supabase.from("audit_events").insert({ resume_id: id, action: "resume_deleted", details: {} });
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (!error) {
      router.replace("/dashboard");
      router.refresh();
    }
  }

  const unplaced = row.qa_state.unplaced ?? [];
  const warnings = row.qa_state.warnings ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className={buttonClass("ghost", "sm")}>←</Link>
          <input
            aria-label="Resume name"
            value={row.title}
            size={Math.max(8, row.title.length + 1)}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 rounded-md border border-transparent bg-transparent px-2 py-1 text-xl font-bold text-ink hover:border-line focus:border-brand focus:outline-none"
          />
          {row.status === "approved" ? <Badge tone="ok">Approved</Badge> : <Badge>Draft</Badge>}
        </div>
        <div className="flex items-center gap-3">
          <SaveIndicator status={saveStatus} />
          {row.origin === "qa" && (
            <Link href={`/resumes/${id}/build`} className={buttonClass("secondary", "sm")}>Guided questions</Link>
          )}
        </div>
      </div>

      <div role="tablist" aria-label="Resume Studio" className="mb-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.key ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
            {t.key === "edit" && pending.length > 0 && <Badge tone="warn">{pending.length}</Badge>}
            {t.key === "check" && <Badge tone={score >= 75 ? "ok" : score >= 50 ? "warn" : "bad"}>{score}</Badge>}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="min-w-0 space-y-8" role="tabpanel">
          {tab === "edit" && (
            <>
              {row.origin === "upload" && (warnings.length > 0 || pending.length > 0) && (
                <Notice tone="brand">
                  We pulled these details from your upload. Please check each one, fix anything we got wrong, and tick
                  &quot;accurate&quot; to confirm it. We never add anything that wasn&apos;t in your file.
                  {warnings.length > 0 && <ul className="mt-2 list-disc pl-5">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
                </Notice>
              )}
              {unplaced.length > 0 && showUnplaced && (
                <div className="rounded-xl border border-warn/30 bg-warn-soft/50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-ink">Text we couldn&apos;t place ({unplaced.length} lines)</h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowUnplaced(false)}>Hide</Button>
                  </div>
                  <p className="text-sm text-muted">Copy anything important into the right section below.</p>
                  <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-white p-3 text-xs text-ink">{unplaced.join("\n")}</pre>
                </div>
              )}
              <Section title="Target role"><TargetRoleEditor resume={r} onChange={setContent} /></Section>
              <Section id="section-contact" title="Contact"><ContactEditor resume={r} onChange={setContent} /></Section>
              <Section id="section-summary" title="Summary"><SummaryEditor resume={r} onChange={setContent} /></Section>
              <Section title="Work experience"><ExperienceEditor resume={r} onChange={setContent} /></Section>
              <Section title="Education"><EducationEditor resume={r} onChange={setContent} /></Section>
              <Section title="Projects"><ProjectsEditor resume={r} onChange={setContent} /></Section>
              <Section title="Volunteering"><ExperienceEditor resume={r} onChange={setContent} kinds={["volunteer"]} addLabel="Add volunteering" /></Section>
              <Section title="Certifications"><CertificationsEditor resume={r} onChange={setContent} /></Section>
              <Section id="section-skills" title="Skills"><SkillsEditor resume={r} onChange={setContent} /></Section>
              <div className="border-t border-line pt-6">
                <Button variant="ghost" className="text-bad" onClick={remove}>Delete this resume</Button>
              </div>
            </>
          )}
          {tab === "check" && <QualityPanel resume={r} />}
          {tab === "match" && <JdMatchPanel resume={r} />}
          {tab === "export" && (
            <ExportPanel resumeId={id} resume={r} supabase={supabase} flush={flush} onApproved={markApproved} onJump={jump} />
          )}
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-2 text-sm font-semibold text-ink">Preview</h2>
          <ResumePreview resume={r} />
        </aside>
      </div>
    </div>
  );
}

function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id}>
      <h2 className="mb-3 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </section>
  );
}
