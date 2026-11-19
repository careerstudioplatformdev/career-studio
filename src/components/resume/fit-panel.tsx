"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Badge, Button, Card, Notice, TextArea } from "@/components/ui";
import { analyzeFit, type FitCheck, type KeywordPriority } from "@/lib/resume/jd-fit";
import { addConfirmedSkill, reorderForJob } from "@/lib/resume/tailor";
import type { ResumeContent, ResumeRow } from "@/lib/resume/types";
import { callAi } from "./ai";

type TailorResult = {
  summary: string;
  bulletSuggestions: { entryId: string; original: string; suggested: string; keywordsUsed: string[] }[];
  keywordsToConfirm: { term: string; question: string }[];
  coverLetter: string;
  removed: string[];
};

const PRIORITY: Record<KeywordPriority, { label: string; tone: "bad" | "warn" | "neutral" }> = {
  critical: { label: "Critical", tone: "bad" },
  important: { label: "Important", tone: "warn" },
  nice: { label: "Nice to have", tone: "neutral" },
};

function statusTone(c: FitCheck) {
  return c.status === "ok" ? "ok" : c.status === "partial" ? "warn" : "bad";
}

export function FitPanel({
  row,
  jobDescription,
  onJobDescription,
  aiEnabled,
  supabase,
  flush,
  onChange,
  applicationId,
}: {
  applicationId?: string | null;
  row: ResumeRow;
  jobDescription: string;
  onJobDescription: (jd: string) => void;
  aiEnabled: boolean | null;
  supabase: SupabaseClient;
  flush: () => Promise<boolean>;
  onChange: (r: ResumeContent) => void;
}) {
  const router = useRouter();
  const resume = row.content;
  const jd = jobDescription;
  const fit = useMemo(() => (jd.trim().length > 40 ? analyzeFit(resume, jd) : null), [resume, jd]);
  const [baseline, setBaseline] = useState<number | null>(null);
  const [tailor, setTailor] = useState<TailorResult | null>(null);
  const [coverLetter, setCoverLetter] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const change = (next: ResumeContent) => {
    if (fit && baseline === null) setBaseline(fit.score);
    onChange(next);
  };

  async function getSuggestions() {
    setBusy("tailor");
    setError(null);
    try {
      setTailor(await callAi<TailorResult>("tailor", { resume, jobDescription: jd, story: row.qa_state.story ?? "", includeCoverLetter: coverLetter }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function acceptBullet(s: TailorResult["bulletSuggestions"][number]) {
    const patch = <T extends { id: string; bullets: string[]; confirmed: boolean; source: string }>(e: T): T =>
      e.id === s.entryId ? { ...e, bullets: e.bullets.map((b) => (b.trim() === s.original.trim() ? s.suggested : b)), confirmed: false, source: "ai" } : e;
    change({ ...resume, experience: resume.experience.map(patch), projects: resume.projects.map(patch) });
    setTailor((t) => (t ? { ...t, bulletSuggestions: t.bulletSuggestions.filter((x) => x !== s) } : t));
  }

  async function saveTailoredCopy() {
    if (!fit) return;
    setBusy("save");
    setError(null);
    try {
      await flush();
      const content = reorderForJob(resume, jd);
      const { data: copy, error: e1 } = await supabase
        .from("resumes")
        .insert({
          origin: "tailored",
          parent_id: row.id,
          title: `${row.title} – ${fit.jobTitle || "tailored"}`.slice(0, 120),
          content,
          qa_state: { completed: true, jobDescription: jd, story: row.qa_state.story ?? "" },
        })
        .select("id")
        .single();
      if (e1 || !copy) throw e1 ?? new Error("Couldn't create the copy.");
      const score = analyzeFit(content, jd).score;
      const { error: e2 } = applicationId
        ? await supabase
            .from("job_applications")
            .update({ resume_id: copy.id, status: "tailoring", match_score: score, ...(tailor?.coverLetter ? { cover_letter: tailor.coverLetter } : {}) })
            .eq("id", applicationId)
        : await supabase.from("job_applications").insert({
            resume_id: copy.id,
            job_title: fit.jobTitle,
            description: jd.slice(0, 20000),
            status: "tailoring",
            match_score: score,
            cover_letter: tailor?.coverLetter ?? "",
          });
      if (e2) throw e2;
      await supabase.from("audit_events").insert({ resume_id: copy.id, action: "resume_tailored", details: { parent_id: row.id, score: fit.score } });
      setMessage("Tailored copy saved and added to your applications.");
      router.push(`/resumes/${copy.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the tailored copy.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-ink">Fit your resume to a job</h3>
        <p className="mb-3 text-sm text-muted">
          Paste a job posting. You&apos;ll get an explainable ATS match score, the keywords that matter most, and honest ways to close
          the gaps.
        </p>
        <TextArea
          label="Job description"
          rows={8}
          value={jd}
          maxLength={15000}
          onChange={(e) => onJobDescription(e.target.value)}
          placeholder="Paste the full job posting here, including the title and requirements…"
        />
      </Card>

      {fit && (
        <>
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h3 className="font-semibold text-ink">ATS match{fit.jobTitle ? `: ${fit.jobTitle}` : ""}</h3>
                <p className="text-sm text-muted">Each point comes from a rule below. It&apos;s a guide, not a prediction of hiring.</p>
              </div>
              <div className="text-right">
                <div className={`font-[family-name:var(--font-display)] text-4xl font-semibold tracking-[-0.03em] ${fit.score >= 75 ? "text-ok" : fit.score >= 50 ? "text-warn" : "text-bad"}`}>
                  {fit.score}
                  <span className="text-base font-medium text-muted">/100</span>
                </div>
                {baseline !== null && baseline !== fit.score && (
                  <div className="text-xs text-muted">was {baseline} before your changes</div>
                )}
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {fit.checks.map((c) => (
                <li key={c.key}>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>{c.name}</span>
                    <Badge tone={statusTone(c)}>{c.points}/{c.max}</Badge>
                  </div>
                  <p className="text-sm text-muted">{c.detail}</p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink">Keywords, by priority</h3>
            <p className="mb-3 text-sm text-muted">
              Critical terms appear in the title or repeatedly in requirements. Only add a missing term if it&apos;s true for you.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="py-1 pr-2 font-medium">Keyword</th>
                    <th className="py-1 pr-2 font-medium">Priority</th>
                    <th className="py-1 pr-2 font-medium">In your resume</th>
                    <th className="py-1 font-medium"><span className="sr-only">Action</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {fit.keywords.map((k) => (
                    <tr key={k.term}>
                      <td className="py-1.5 pr-2 font-medium">{k.term}</td>
                      <td className="py-1.5 pr-2"><Badge tone={PRIORITY[k.priority].tone}>{PRIORITY[k.priority].label}</Badge></td>
                      <td className="py-1.5 pr-2 text-muted">{k.foundIn.length ? k.foundIn.join(", ") : <span className="text-warn">Missing</span>}</td>
                      <td className="py-1.5 text-right">
                        {!k.foundIn.length && (
                          <Button size="sm" variant="ghost" onClick={() => change(addConfirmedSkill(resume, k.term))}>
                            I have this
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted">&quot;I have this&quot; adds the term to your skills for you to confirm. Showing it in a bullet is even better.</p>
          </Card>

          <Card>
            <h3 className="font-semibold text-ink">Tailor it</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" onClick={() => change(reorderForJob(resume, jd))}>Put the most relevant points first</Button>
              <Button variant="secondary" disabled={busy !== null} onClick={saveTailoredCopy}>
                {busy === "save" ? "Saving…" : "Save as a tailored copy & track application"}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted">Reordering moves your skills and bullets; it never adds or rewrites anything.</p>

            <div className="mt-5 border-t border-line pt-4">
              <h4 className="font-medium text-ink">AI tailoring suggestions</h4>
              <p className="text-sm text-muted">Rewrites that surface keywords your experience already supports, plus questions about missing ones.</p>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={coverLetter} onChange={(e) => setCoverLetter(e.target.checked)} />
                Also draft a cover letter
              </label>
              <Button className="mt-3" disabled={busy !== null || aiEnabled === false} onClick={getSuggestions}>
                {busy === "tailor" ? "Tailoring…" : "Get suggestions"}
              </Button>
              {aiEnabled === false && <p className="mt-2 text-xs text-muted">AI assist isn&apos;t switched on yet.</p>}
            </div>
          </Card>
        </>
      )}

      {error && <Notice tone="bad">{error}</Notice>}
      {message && <Notice tone="ok">{message}</Notice>}

      {tailor && (
        <Card>
          <h3 className="font-semibold text-ink">Suggestions</h3>
          {tailor.removed.length > 0 && (
            <div className="mt-2"><Notice tone="warn">We dropped {tailor.removed.length} suggestion(s) that contained numbers you never gave us.</Notice></div>
          )}
          {tailor.summary && tailor.summary !== resume.summary && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Summary for this job</h4>
              <p className="mt-1 rounded bg-grey-50 p-2 text-sm">{tailor.summary}</p>
              <Button size="sm" className="mt-2" onClick={() => change({ ...resume, summary: tailor.summary, summaryConfirmed: false })}>Use this summary</Button>
            </div>
          )}
          {tailor.bulletSuggestions.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold">Bullet rewrites</h4>
              {tailor.bulletSuggestions.map((s) => (
                <div key={s.original} className="rounded-xl border border-hairline p-3 text-sm">
                  <p className="text-muted line-through">{s.original}</p>
                  <p className="mt-1 text-ink">{s.suggested}</p>
                  {s.keywordsUsed.length > 0 && <p className="mt-1 text-xs text-muted">Surfaces: {s.keywordsUsed.join(", ")}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => acceptBullet(s)}>Accept</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTailor({ ...tailor, bulletSuggestions: tailor.bulletSuggestions.filter((x) => x !== s) })}>Dismiss</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tailor.keywordsToConfirm.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Do you have these?</h4>
              <ul className="mt-2 space-y-2">
                {tailor.keywordsToConfirm.map((k) => (
                  <li key={k.term} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>{k.question}</span>
                    <span className="flex gap-1">
                      <Button size="sm" variant="secondary" onClick={() => {
                        change(addConfirmedSkill(resume, k.term));
                        setTailor({ ...tailor, keywordsToConfirm: tailor.keywordsToConfirm.filter((x) => x !== k) });
                      }}>Yes, add “{k.term}”</Button>
                      <Button size="sm" variant="ghost" onClick={() => setTailor({ ...tailor, keywordsToConfirm: tailor.keywordsToConfirm.filter((x) => x !== k) })}>No</Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tailor.coverLetter && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold">Cover letter draft</h4>
              <p className="text-xs text-muted">Fill in anything in [brackets] and read it carefully before sending.</p>
              <pre className="mt-2 whitespace-pre-wrap rounded bg-grey-50 p-3 font-sans text-sm">{tailor.coverLetter}</pre>
              <Button size="sm" variant="secondary" className="mt-2" onClick={() => navigator.clipboard?.writeText(tailor.coverLetter)}>Copy</Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
