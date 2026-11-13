"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card, Notice, TextArea } from "@/components/ui";
import { resumeQuestions, type InterviewQuestion } from "@/lib/resume/interview";
import type { ResumeContent } from "@/lib/resume/types";
import { callAi } from "./ai";

type Feedback = {
  scores: { relevance: number; structure: number; specificity: number; communication: number };
  strengths: string[];
  improvements: string[];
  strongerAnswer: string;
  followUp: string;
};

const SESSIONS = [15, 30, 45, 60, 90];
const KIND_LABEL: Record<InterviewQuestion["kind"], string> = {
  behavioral: "Behavioral",
  technical: "Technical",
  resume: "About your resume",
  screening: "HR screening",
  gap: "Timeline",
};

export function InterviewPanel({ resume, jobDescription, aiEnabled }: { resume: ResumeContent; jobDescription: string; aiEnabled: boolean | null }) {
  const base = useMemo(() => resumeQuestions(resume, 20), [resume]);
  const [aiQuestions, setAiQuestions] = useState<InterviewQuestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minutes, setMinutes] = useState(15);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  const all = [...aiQuestions, ...base];
  // About 3 minutes per question, as in a real interview.
  const questions = endsAt ? all.slice(0, Math.max(3, Math.round(minutes / 3))) : all;
  const left = endsAt ? Math.max(0, Math.round((endsAt - now) / 1000)) : 0;

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await callAi<{ questions: Omit<InterviewQuestion, "id">[] }>("interview", { mode: "questions", resume, jobDescription });
      setAiQuestions(res.questions.map((q, i) => ({ ...q, id: `ai-${Date.now()}-${i}` })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-ink">Interview prep from your resume</h3>
        <p className="mt-1 text-sm text-muted">
          Interviewers ask about what&apos;s on the page. Practice answering out loud or in writing, then get feedback.
          {jobDescription.trim() ? " AI questions also use the job description you added." : ""}
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium">Practice session</span>
            <select className="rounded-lg border border-line bg-white px-3 py-2 text-sm" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              {SESSIONS.map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          {endsAt ? (
            <Button variant="secondary" onClick={() => setEndsAt(null)}>
              End session ({Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")} left)
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setEndsAt(Date.now() + minutes * 60_000)}>Start timed session</Button>
          )}
          <Button disabled={busy || aiEnabled === false} onClick={generate}>{busy ? "Writing questions…" : "Generate AI questions"}</Button>
        </div>
        {endsAt && left === 0 && <div className="mt-3"><Notice tone="ok">Time&apos;s up. Review your feedback below and try again whenever you like.</Notice></div>}
        {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}
      </Card>

      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={q.id}>
            <QuestionCard index={i + 1} q={q} resume={resume} aiEnabled={aiEnabled} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuestionCard({ index, q, resume, aiEnabled }: { index: number; q: InterviewQuestion; resume: ResumeContent; aiEnabled: boolean | null }) {
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function getFeedback() {
    setBusy(true);
    setError(null);
    try {
      setFeedback(await callAi<Feedback>("interview", { mode: "feedback", resume, question: q.question, answer }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="group rounded-xl border border-line bg-white p-4">
      <summary className="flex cursor-pointer list-none items-start gap-3">
        <span className="mt-0.5 text-sm font-semibold text-brand">{index}.</span>
        <span className="flex-1">
          <span className="block font-medium text-ink">{q.question}</span>
          <span className="mt-1 flex flex-wrap gap-1">
            <Badge tone="brand">{KIND_LABEL[q.kind]}</Badge>
            <span className="text-xs text-muted">Based on: {q.basedOn}</span>
          </span>
        </span>
      </summary>
      <div className="mt-3 space-y-3 pl-6">
        <ul className="list-disc pl-5 text-sm text-muted">{q.tips.map((t) => <li key={t}>{t}</li>)}</ul>
        <TextArea label="Your practice answer" rows={5} value={answer} maxLength={6000} onChange={(e) => setAnswer(e.target.value)} />
        <Button size="sm" disabled={busy || answer.trim().length < 10 || aiEnabled === false} onClick={getFeedback}>
          {busy ? "Reviewing…" : "Get feedback"}
        </Button>
        {error && <Notice tone="bad">{error}</Notice>}
        {feedback && (
          <div className="space-y-2 rounded-lg bg-canvas p-3 text-sm">
            <div className="flex flex-wrap gap-2">
              {Object.entries(feedback.scores).map(([k, v]) => (
                <Badge key={k} tone={v >= 4 ? "ok" : v >= 3 ? "warn" : "bad"}>{k}: {v}/5</Badge>
              ))}
            </div>
            {feedback.strengths.length > 0 && <ul className="list-disc pl-5 text-ok">{feedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul>}
            {feedback.improvements.length > 0 && <ul className="list-disc pl-5 text-warn">{feedback.improvements.map((s) => <li key={s}>{s}</li>)}</ul>}
            <div>
              <div className="font-medium">A stronger answer could go like this</div>
              <p className="whitespace-pre-wrap">{feedback.strongerAnswer}</p>
            </div>
            <p className="text-muted">Likely follow-up: {feedback.followUp}</p>
          </div>
        )}
      </div>
    </details>
  );
}
