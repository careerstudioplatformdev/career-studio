"use client";

import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge, Button, Card, CheckIcon, Meter, Notice } from "@/components/ui";
import { downloadBlob } from "@/lib/download";
import { hasMinimumContent, isExportReady, pendingConfirmations } from "@/lib/resume/facts";
import { clampPages } from "@/lib/resume/factory";
import { candidateYears } from "@/lib/resume/jd-fit";
import { buildLayout, fileBaseName } from "@/lib/resume/layout";
import { fitToPages, recommendedPages } from "@/lib/resume/length";
import { scoreResume, type RedFlagCategory } from "@/lib/resume/quality";
import type { PageTarget, ResumeContent } from "@/lib/resume/types";

// ---------- Live preview (same layout as the exported files) ----------

export function ResumePreview({ resume, fscan = false }: { resume: ResumeContent; fscan?: boolean }) {
  const fit = useMemo(() => fitToPages(buildLayout(resume), resume.pageTarget), [resume]);
  const layout = fit.layout;
  const empty = !layout.name && layout.sections.length === 0;
  const mark = (on: boolean) => (fscan && on ? "rounded-sm bg-amber-200/70" : "");
  return (
    <div className="rounded-[28px] border border-hairline bg-grey-50 p-4 sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-[13px] text-grey-600">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok" />
        Live preview
      </p>
      <div
        className={`relative aspect-[8.5/11] w-full overflow-auto rounded-xl border border-hairline bg-white p-[6%] text-[11px] leading-snug text-ink shadow-[0_8px_30px_rgba(24,24,27,0.06)] ${fscan ? "ring-2 ring-amber-300" : ""}`}
        aria-label="Resume preview"
      >
        {fscan && <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[22%] bg-amber-100/50" />}
        {empty ? (
          <div className="flex h-full flex-col gap-3">
            <span className="sr-only">Your resume preview appears here as you answer.</span>
            <div aria-hidden="true" className="mx-auto mt-2 h-3 w-1/2 rounded-full bg-grey-100" />
            <div aria-hidden="true" className="mx-auto h-2 w-2/3 rounded-full bg-grey-100" />
            {[0, 1, 2].map((i) => (
              <div key={i} aria-hidden="true" className="mt-4 flex flex-col gap-2">
                <div className="h-2 w-1/4 rounded-full bg-grey-100" />
                <div className="h-2 w-full rounded-full bg-grey-100" />
                <div className="h-2 w-5/6 rounded-full bg-grey-100" />
              </div>
            ))}
            <p className="mt-auto text-center text-xs text-muted">Your resume appears here as you answer.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="text-center">
              <div className="text-lg font-bold">{layout.name || <span className="text-muted">Your name</span>}</div>
              {layout.contactLine && <div className="mt-0.5 text-[10px] text-muted">{layout.contactLine}</div>}
            </div>
            {layout.sections.map((s) => (
              <section key={s.title} className="mt-3">
                <h3 className={`border-b border-gray-300 pb-0.5 font-sans text-[11px] font-bold uppercase tracking-wide ${mark(true)}`} style={{ letterSpacing: "0.04em" }}>{s.title}</h3>
                {s.text && <p className="mt-1">{s.text}</p>}
                {s.entries?.map((e, i) => (
                  <div key={i} className="mt-1.5">
                    <div className="flex justify-between gap-2">
                      <span className={`font-semibold ${mark(i === 0)}`}>{e.heading}</span>
                      <span className="shrink-0">{e.dates}</span>
                    </div>
                    {e.subheading && <div className="italic">{e.subheading}</div>}
                    {e.bullets.length > 0 && (
                      <ul className="ml-3 list-disc">
                        {e.bullets.map((b, j) => {
                          const words = b.split(/\s+/);
                          return (
                            <li key={j}>
                              <span className={mark(true)}>{words.slice(0, 3).join(" ")}</span> {words.slice(3).join(" ")}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
      </div>
      {!empty && (
        <p className="mt-3 text-xs text-grey-600">
          About {fit.estimatedPages} page{fit.estimatedPages === 1 ? "" : "s"} · target {resume.pageTarget}
          {fit.trimmed.length > 0 && " · shortened to fit"}
          {fscan && " · highlighted: where recruiters' eyes land"}
        </p>
      )}
    </div>
  );
}

const PAGE_LABELS: Record<number, string> = {
  1: "Students, new grads, under 8 years",
  2: "Most experienced professionals",
  3: "Senior leaders, 15+ years",
  4: "Executive or academic CV style",
  5: "Federal, academic or very detailed CVs",
};

export function PageTargetPicker({ value, onChange, compact = false }: { value: PageTarget; onChange: (n: number) => void; compact?: boolean }) {
  return (
    <fieldset>
      <legend className="mb-1 text-sm font-medium text-ink">Resume length</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            onClick={() => onChange(n)}
            className={`inline-flex min-h-11 items-center gap-1.5 rounded-[10px] px-4 text-sm font-medium ${value === n ? "border-[1.5px] border-ink bg-grey-50 text-ink" : "border border-grey-200 bg-white text-grey-700 hover:border-grey-400"}`}
          >
            {value === n && <CheckIcon className="h-3.5 w-3.5" />}
            {n} page{n > 1 ? "s" : ""}
          </button>
        ))}
      </div>
      {!compact && <p className="mt-1 text-xs text-muted">{PAGE_LABELS[value]}. We trim lower-priority detail to fit and never pad with filler.</p>}
    </fieldset>
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
          <div className={`font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em] ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"}`}>
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
              <div className="mt-1.5">
                <Meter value={c.points} max={c.max} label={`${c.name} score`} />
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

const FLAG_GROUPS: { key: RedFlagCategory; title: string }[] = [
  { key: "timeline", title: "Timeline" },
  { key: "evidence", title: "Evidence & results" },
  { key: "wording", title: "Wording" },
  { key: "consistency", title: "Consistency" },
  { key: "contact", title: "Contact details" },
];

export function RedFlags({ resume }: { resume: ResumeContent }) {
  const flags = useMemo(() => scoreResume(resume).redFlags, [resume]);
  return (
    <Card>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink">Red flags</h3>
        <Badge tone={flags.some((f) => f.severity === "high") ? "bad" : flags.length ? "warn" : "ok"}>{flags.length} found</Badge>
      </div>
      <p className="text-sm text-muted">What a recruiter might question: gaps, vague bullets, missing results, inconsistencies.</p>
      {flags.length === 0 ? (
        <p className="mt-2 text-sm text-ok">No red flags found.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {FLAG_GROUPS.map((g) => {
            const items = flags.filter((f) => (f.category ?? "timeline") === g.key);
            if (!items.length) return null;
            return (
              <div key={g.key}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{g.title}</h4>
                <ul className="mt-1 space-y-2">
                  {items.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Badge tone={f.severity === "high" ? "bad" : f.severity === "medium" ? "warn" : "neutral"}>
                        {f.severity === "high" ? "Fix" : f.severity === "medium" ? "Check" : "Note"}
                      </Badge>
                      <span>{f.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
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
  onChange,
}: {
  resumeId: string;
  resume: ResumeContent;
  onChange: (r: ResumeContent) => void;
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

      const layout = fitToPages(buildLayout(resume), resume.pageTarget).layout;
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

      <div className="mt-4 rounded-xl bg-grey-50 p-3">
        <PageTargetPicker value={resume.pageTarget} onChange={(n) => onChange({ ...resume, pageTarget: clampPages(n) })} />
        <LengthReport resume={resume} />
      </div>

      {!enough && <Notice tone="warn">Add your name and at least one experience, education or project entry first.</Notice>}

      {pending.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-warn">Confirm these {pending.length} item{pending.length > 1 ? "s" : ""} before downloading:</p>
          <ul className="mt-1 space-y-1">
            {pending.map((p) => (
              <li key={p.id} className="text-sm">
                {onJump ? (
                  <button type="button" className="font-medium text-orange-ink underline underline-offset-2" onClick={() => onJump(p.section, p.id)}>{p.label}</button>
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

function LengthReport({ resume }: { resume: ResumeContent }) {
  const fit = useMemo(() => fitToPages(buildLayout(resume), resume.pageTarget), [resume]);
  const years = candidateYears(resume);
  const suggested = recommendedPages(years);
  return (
    <div className="mt-2 space-y-1 text-sm">
      <p className="text-ink">
        Estimated length: <strong>{fit.estimatedPages}</strong> page{fit.estimatedPages === 1 ? "" : "s"}.
        {suggested !== resume.pageTarget && (
          <span className="text-muted"> With about {years} years of experience, {suggested} page{suggested > 1 ? "s" : ""} is typical.</span>
        )}
      </p>
      {fit.trimmed.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-muted">
          {fit.trimmed.map((t) => <li key={t}>{t} Your saved resume keeps everything.</li>)}
        </ul>
      )}
      {!fit.fits && <p className="text-xs text-warn">Still over {resume.pageTarget} page{resume.pageTarget > 1 ? "s" : ""} after trimming. Shorten some bullets or choose a longer length.</p>}
      {fit.underfilled && (
        <p className="text-xs text-muted">
          Your content fills about {fit.estimatedPages} page{fit.estimatedPages === 1 ? "" : "s"}. We don&apos;t add filler, so the file will be shorter than
          {" "}{resume.pageTarget} pages. Add more real detail (projects, results) if you want it longer.
        </p>
      )}
    </div>
  );
}
