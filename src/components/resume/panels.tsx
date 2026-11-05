"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge, Button, Card, Notice, TextArea } from "@/components/ui";
import { downloadBlob } from "@/lib/download";
import { hasMinimumContent, isExportReady, pendingConfirmations } from "@/lib/resume/facts";
import { matchJobDescription } from "@/lib/resume/jd-match";
import { buildLayout, fileBaseName } from "@/lib/resume/layout";
import { scoreResume } from "@/lib/resume/quality";
import type { ResumeContent } from "@/lib/resume/types";

// ---------- Live preview (same layout as the exported files) ----------

export function ResumePreview({ resume }: { resume: ResumeContent }) {
  const layout = useMemo(() => buildLayout(resume), [resume]);
  const empty = !layout.name && layout.sections.length === 0;
  return (
    <div className="aspect-[8.5/11] w-full overflow-auto rounded-lg border border-line bg-white p-[6%] text-[11px] leading-snug text-ink shadow-sm" aria-label="Resume preview">
      {empty ? (
        <p className="pt-20 text-center text-sm text-muted">Your resume preview appears here as you answer.</p>
      ) : (
        <>
          <div className="text-center">
            <div className="text-lg font-bold">{layout.name || <span className="text-muted">Your name</span>}</div>
            {layout.contactLine && <div className="mt-0.5 text-[10px] text-muted">{layout.contactLine}</div>}
          </div>
          {layout.sections.map((s) => (
            <section key={s.title} className="mt-3">
              <h3 className="border-b border-gray-300 pb-0.5 text-[11px] font-bold uppercase tracking-wide">{s.title}</h3>
              {s.text && <p className="mt-1">{s.text}</p>}
              {s.entries?.map((e, i) => (
                <div key={i} className="mt-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{e.heading}</span>
                    <span className="shrink-0">{e.dates}</span>
                  </div>
                  {e.subheading && <div className="italic">{e.subheading}</div>}
                  {e.bullets.length > 0 && (
                    <ul className="ml-3 list-disc">
                      {e.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </div>
  );
}

// ---------- Quality score and red flags ----------

export function QualityPanel({ resume }: { resume: ResumeContent }) {
  const report = useMemo(() => scoreResume(resume), [resume]);
  const tone = report.score >= 75 ? "ok" : report.score >= 50 ? "warn" : "bad";
  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-end justify-between">
          <div>
            <h3 className="font-semibold text-ink">Resume quality</h3>
            <p className="text-sm text-muted">A transparent checklist. It measures structure and clarity, not your worth as a candidate.</p>
          </div>
          <div className={`text-3xl font-bold ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"}`}>
            {report.score}<span className="text-base font-medium text-muted">/100</span>
          </div>
        </div>
        <div className="mt-4 space-y-4">
          {report.categories.map((c) => (
            <div key={c.key}>
              <div className="flex justify-between text-sm font-medium">
                <span>{c.name}</span>
                <span className="text-muted">{c.points}/{c.max}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-canvas">
                <div className="h-1.5 rounded-full bg-brand" style={{ width: `${(c.points / c.max) * 100}%` }} />
              </div>
              <ul className="mt-2 space-y-1">
                {c.checks.map((ch) => (
                  <li key={ch.label} className="flex gap-2 text-sm">
                    <span aria-hidden className={ch.passed ? "text-ok" : "text-muted"}>{ch.passed ? "✓" : "○"}</span>
                    <span>
                      <span className="sr-only">{ch.passed ? "Passed: " : "To do: "}</span>
                      {ch.label}
                      {!ch.passed && ch.tip && <span className="block text-xs text-muted">{ch.tip}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <RedFlags resume={resume} />
    </div>
  );
}

export function RedFlags({ resume }: { resume: ResumeContent }) {
  const flags = useMemo(() => scoreResume(resume).redFlags, [resume]);
  return (
    <Card>
      <h3 className="font-semibold text-ink">Timeline check</h3>
      {flags.length === 0 ? (
        <p className="mt-1 text-sm text-ok">No date problems, gaps or overlaps found.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {flags.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Badge tone={f.severity === "high" ? "bad" : f.severity === "medium" ? "warn" : "neutral"}>
                {f.severity === "high" ? "Fix" : f.severity === "medium" ? "Check" : "Note"}
              </Badge>
              <span>{f.message}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ---------- Job description match ----------

export function JdMatchPanel({ resume }: { resume: ResumeContent }) {
  const [jd, setJd] = useState("");
  const result = useMemo(() => (jd.trim().length > 40 ? matchJobDescription(resume, jd) : null), [resume, jd]);
  return (
    <Card>
      <h3 className="font-semibold text-ink">Compare with a job posting</h3>
      <p className="mb-3 text-sm text-muted">Paste a job description to see which of its key terms your resume already covers.</p>
      <TextArea label="Job description" rows={8} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job posting here…" />
      {result && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Keyword coverage</span>
            <span className="text-2xl font-bold text-brand">{result.score}%</span>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-ok">Covered ({result.matched.length})</div>
            <div className="flex flex-wrap gap-1">{result.matched.map((k) => <Badge key={k} tone="ok">{k}</Badge>)}</div>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-warn">Not found ({result.missing.length})</div>
            <div className="flex flex-wrap gap-1">{result.missing.map((k) => <Badge key={k} tone="warn">{k}</Badge>)}</div>
          </div>
          <Notice tone="neutral">
            Only add a missing term if it&apos;s true for you, ideally in a bullet that shows how you used it. Keyword
            coverage is one signal, not a prediction of whether you&apos;ll get the job.
          </Notice>
        </div>
      )}
    </Card>
  );
}

// ---------- Approval and export ----------

export function ExportPanel({
  resumeId,
  resume,
  supabase,
  flush,
  onApproved,
  onJump,
}: {
  resumeId: string;
  resume: ResumeContent;
  supabase: SupabaseClient;
  flush: () => Promise<boolean>;
  onApproved: () => void;
  onJump?: (section: string, id: string) => void;
}) {
  const pending = pendingConfirmations(resume);
  const enough = hasMinimumContent(resume);
  const ready = isExportReady(resume);
  const [attest, setAttest] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(format: "pdf" | "docx") {
    setBusy(format);
    setError(null);
    try {
      if (!(await flush())) throw new Error("Couldn't save your latest changes. Please try again.");
      // Record an immutable snapshot of exactly what the user approved.
      const { error: vErr } = await supabase.from("resume_versions").insert({ resume_id: resumeId, content: resume, reason: "approved_export" });
      if (vErr) throw vErr;
      const { error: rErr } = await supabase
        .from("resumes")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", resumeId);
      if (rErr) throw rErr;
      await supabase.from("audit_events").insert({ resume_id: resumeId, action: "resume_exported", details: { format, attested: true } });
      onApproved();

      const layout = buildLayout(resume);
      const name = fileBaseName(resume);
      if (format === "pdf") {
        const { buildPdf } = await import("@/lib/resume/export-pdf");
        const bytes = await buildPdf(layout);
        downloadBlob(new Blob([bytes as BlobPart], { type: "application/pdf" }), `${name}.pdf`);
      } else {
        const { docxBlob } = await import("@/lib/resume/export-docx");
        downloadBlob(await docxBlob(layout), `${name}.docx`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <h3 className="font-semibold text-ink">Approve and download</h3>
      <p className="text-sm text-muted">Clean single-column Word and PDF files that applicant tracking systems can read.</p>

      {!enough && <Notice tone="warn">Add your name and at least one experience, education or project entry first.</Notice>}

      {pending.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-warn">Confirm these {pending.length} item{pending.length > 1 ? "s" : ""} before downloading:</p>
          <ul className="mt-1 space-y-1">
            {pending.map((p) => (
              <li key={p.id} className="text-sm">
                {onJump ? (
                  <button type="button" className="text-brand underline" onClick={() => onJump(p.section, p.id)}>{p.label}</button>
                ) : (
                  p.label
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ready && (
        <label className="mt-3 flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={attest} onChange={(e) => setAttest(e.target.checked)} />
          <span>I&apos;ve reviewed this resume and everything on it is true and mine to share.</span>
        </label>
      )}

      {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={!ready || !attest || busy !== null} onClick={() => download("pdf")}>
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </Button>
        <Button variant="secondary" disabled={!ready || !attest || busy !== null} onClick={() => download("docx")}>
          {busy === "docx" ? "Preparing…" : "Download Word (.docx)"}
        </Button>
      </div>
    </Card>
  );
}
