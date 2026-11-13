"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge, Button, Card, Notice } from "@/components/ui";
import type { ResumeContent } from "@/lib/resume/types";
import { applyVariant, type SanitizedVariant } from "@/lib/resume/variants";
import { callAi } from "./ai";

type Version = { key: "A" | "B" | "C" | "final"; label: string; variant: SanitizedVariant; scores: Record<string, number> };
type AgentRun = {
  versions: Version[];
  reviews: { agent: string; output: { reviews: { variant: string; score: number; strengths: string[]; issues: string[] }[] } }[];
  recommended: "A" | "B" | "C";
  rationale: string;
};

const STAGES = [
  "Builder agents are writing recruiter-, ATS- and achievement-focused versions…",
  "Review agents are scoring ATS fit, readability and factual accuracy…",
  "The final approval agent is resolving issues and choosing the strongest version…",
];

export function ImprovePanel({
  resumeId,
  resume,
  story,
  jobDescription,
  aiEnabled,
  supabase,
  onChange,
}: {
  resumeId: string;
  resume: ResumeContent;
  story: string;
  jobDescription: string;
  aiEnabled: boolean | null;
  supabase: SupabaseClient;
  onChange: (r: ResumeContent) => void;
}) {
  const [run, setRun] = useState<AgentRun | null>(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Version["key"]>("final");
  const [undo, setUndo] = useState<ResumeContent | null>(null);
  const [useJd, setUseJd] = useState(Boolean(jobDescription.trim()));

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 25000);
    return () => clearInterval(t);
  }, [busy]);

  async function start() {
    setStage(0);
    setBusy(true);
    setError(null);
    try {
      const res = await callAi<AgentRun>("agents", { resume, story, jobDescription: useJd ? jobDescription : "" });
      setRun(res);
      setSelected("final");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function apply(v: SanitizedVariant) {
    // Keep a snapshot so the user can always get back to what they had.
    await supabase.from("resume_versions").insert({ resume_id: resumeId, content: resume, reason: "before_ai_version" });
    setUndo(resume);
    onChange(applyVariant(resume, v));
  }

  const names = new Map<string, string>([
    ...resume.experience.map((e) => [e.id, [e.title, e.organization].filter(Boolean).join(" · ")] as [string, string]),
    ...resume.projects.map((p) => [p.id, p.name] as [string, string]),
  ]);
  const current = run?.versions.find((v) => v.key === selected);

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-ink">Seven-agent resume review</h3>
        <p className="mt-1 text-sm text-muted">
          Three builder agents write recruiter-, ATS- and achievement-focused versions of your resume. Three review agents score
          them for ATS fit, readability and factual accuracy. A final approval agent fixes the issues and recommends the strongest
          one. You compare, choose, and confirm every line.
        </p>
        <ol className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
          <li className="rounded-lg bg-canvas p-2"><strong className="text-ink">3 builders</strong><br />Recruiter · ATS · Achievement</li>
          <li className="rounded-lg bg-canvas p-2"><strong className="text-ink">3 reviewers</strong><br />ATS & keywords · Readability · Accuracy</li>
          <li className="rounded-lg bg-canvas p-2"><strong className="text-ink">1 final approver</strong><br />Resolves issues, recommends</li>
        </ol>
        {jobDescription.trim() && (
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={useJd} onChange={(e) => setUseJd(e.target.checked)} />
            Optimize for the job description in &quot;Fit to a job&quot;
          </label>
        )}
        {aiEnabled === false && <div className="mt-3"><Notice tone="warn">AI assist isn&apos;t switched on yet.</Notice></div>}
        {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
        <Button className="mt-4" disabled={busy || aiEnabled === false} onClick={start}>
          {busy ? "Agents at work…" : run ? "Run again" : "Run the 7-agent review"}
        </Button>
        {busy && (
          <p className="mt-3 text-sm text-brand" role="status">
            {STAGES[stage]} <span className="text-muted">(usually 1–3 minutes)</span>
          </p>
        )}
      </Card>

      {undo && (
        <Notice tone="ok">
          Version applied. Changed items are marked &quot;AI-drafted&quot; and need your confirmation in Edit.{" "}
          <button
            type="button"
            className="font-medium underline"
            onClick={() => {
              onChange(undo);
              setUndo(null);
            }}
          >
            Undo
          </button>
        </Notice>
      )}

      {run && (
        <Card>
          <div className="flex flex-wrap gap-1" role="tablist" aria-label="Versions">
            {run.versions.map((v) => (
              <button
                key={v.key}
                role="tab"
                aria-selected={selected === v.key}
                onClick={() => setSelected(v.key)}
                className={`rounded-full px-3 py-1 text-sm ${selected === v.key ? "bg-brand text-white" : "border border-line bg-white text-ink"}`}
              >
                {v.label}
                {v.key === run.recommended && " ★"}
              </button>
            ))}
          </div>
          {selected === "final" && <p className="mt-3 text-sm text-ink">{run.rationale}</p>}
          {current && (
            <div className="mt-4 space-y-4">
              {Object.keys(current.scores).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(current.scores).map(([k, v]) => (
                    <Badge key={k} tone={v >= 80 ? "ok" : v >= 60 ? "warn" : "bad"}>{k}: {v}</Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted">{current.variant.notes}</p>
              {current.variant.removed.length > 0 && (
                <Notice tone="warn">
                  We removed {current.variant.removed.length} line{current.variant.removed.length > 1 ? "s" : ""} that contained numbers you never gave us.
                </Notice>
              )}
              {current.variant.summary && (
                <div>
                  <h4 className="text-sm font-semibold">Summary</h4>
                  <p className="text-sm">{current.variant.summary}</p>
                </div>
              )}
              {current.variant.entries.map((e) => (
                <div key={e.id}>
                  <h4 className="text-sm font-semibold">{names.get(e.id) || "Entry"}</h4>
                  <ul className="ml-4 list-disc text-sm">{e.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>
                </div>
              ))}
              <div>
                <h4 className="text-sm font-semibold">Skills order</h4>
                <p className="text-sm">{current.variant.skills.join(", ")}</p>
              </div>
              {current.key !== "final" && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-brand">What the reviewers said</summary>
                  {run.reviews.map((rv) => {
                    const item = rv.output.reviews.find((x) => x.variant === current.key);
                    if (!item) return null;
                    return (
                      <div key={rv.agent} className="mt-2">
                        <div className="font-medium">{rv.agent}</div>
                        {item.strengths.length > 0 && <ul className="ml-4 list-disc text-ok">{item.strengths.map((s) => <li key={s}>{s}</li>)}</ul>}
                        {item.issues.length > 0 && <ul className="ml-4 list-disc text-warn">{item.issues.map((s) => <li key={s}>{s}</li>)}</ul>}
                      </div>
                    );
                  })}
                </details>
              )}
              <Button onClick={() => apply(current.variant)}>Use this version</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
