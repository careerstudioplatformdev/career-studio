"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card, Eyebrow, Field, Notice, TextArea } from "@/components/ui";
import { clampPages } from "@/lib/resume/factory";
import { pendingConfirmations } from "@/lib/resume/facts";
import type { ChatTurn, QaState, ResumeContent, ResumeRow } from "@/lib/resume/types";
import { callAi } from "./ai";
import { PageTargetPicker, ResumePreview } from "./panels";
import { SaveIndicator, type SaveStatus } from "./use-resume";

type CoachResponse = {
  resume: ResumeContent;
  report: { added: string[]; blocked: string[] };
  nextQuestion: string;
  whyAsking: string;
  readyToReview: boolean;
};

const STORY_PROMPTS = [
  "What kind of job do you want next, and why?",
  "Where did you study, and what did you study?",
  "Every job, internship, volunteer or family-business role you've had, roughly when, and what you did day to day.",
  "Projects you're proud of: school, work or personal. What was the result?",
  "Tools, software, languages or equipment you can use.",
  "Certifications, licenses, awards.",
  "Anything that improved because of you: more customers, less time, fewer mistakes, money raised. Numbers only if you know them.",
];

export function StoryBuilder({
  id,
  row,
  saveStatus,
  setContent,
  setQaState,
  flush,
  aiEnabled,
}: {
  id: string;
  row: ResumeRow;
  saveStatus: SaveStatus;
  setContent: (r: ResumeContent) => void;
  setQaState: (q: QaState) => void;
  flush: () => Promise<boolean>;
  aiEnabled: boolean | null;
}) {
  const router = useRouter();
  const qa = row.qa_state;
  const r = row.content;
  const chat = qa.chat ?? [];
  const [story, setStory] = useState(qa.story ?? "");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReport, setLastReport] = useState<CoachResponse["report"] | null>(null);
  const [ready, setReady] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const started = chat.length > 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [chat.length, busy]);

  const useGuided = () => setQaState({ ...qa, mode: "guided", step: qa.step && qa.step !== "level" ? qa.step : "level" });

  async function ask(nextChat: ChatTurn[], storyText: string) {
    setBusy(true);
    setError(null);
    setQaState({ ...qa, mode: "story", story: storyText, chat: nextChat });
    try {
      const res = await callAi<CoachResponse>("coach", { resume: r, story: storyText, chat: nextChat });
      setContent(res.resume);
      setLastReport(res.report);
      const withQuestion: ChatTurn[] = res.nextQuestion
        ? [...nextChat, { role: "coach", text: res.nextQuestion, why: res.whyAsking }]
        : [...nextChat, { role: "coach", text: "I have what I need for a strong first draft. Review it on the right, then open Resume Studio to confirm each item.", why: "" }];
      setReady(res.readyToReview);
      setQaState({ ...qa, mode: "story", story: storyText, chat: withQuestion });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    setQaState({ ...qa, story, chat, completed: true });
    await flush();
    router.push(`/resumes/${id}`);
  }

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setAnswer("");
    void ask([...chat, { role: "user", text: t }], story);
  };

  const pending = pendingConfirmations(r).length;

  return (
    <div className="mx-auto grid max-w-[1200px] gap-8 px-4 py-8 lg:grid-cols-[1fr_minmax(0,26rem)]">
      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between">
          <Eyebrow>Create my first resume</Eyebrow>
          <SaveIndicator status={saveStatus} />
        </div>

        {aiEnabled === false && (
          <Notice tone="warn">
            AI assist isn&apos;t switched on yet, so we can&apos;t turn your story into a draft. You can still build your resume
            with simple guided questions.{" "}
            <button type="button" className="font-medium underline" onClick={useGuided}>Use guided questions</button>
          </Notice>
        )}

        {!started ? (
          <>
            <h1 className="mt-2 text-[30px] font-semibold text-ink sm:text-[36px]">Tell us your story</h1>
            <p className="mt-1 text-muted">
              Write the way you&apos;d talk to a friend. Our AI career coach turns it into a professional resume, then asks a few
              follow-up questions, one at a time. It only uses what you tell it: nothing is made up, and you approve every line.
            </p>

            <Card className="mt-6 space-y-4">
              <Field
                label="What job are you aiming for?"
                placeholder="e.g. Junior Data Analyst, Medical Assistant, Retail Supervisor"
                value={r.targetRole}
                onChange={(e) => setContent({ ...r, targetRole: e.target.value })}
              />
              <TextArea
                label="Your story"
                rows={12}
                value={story}
                maxLength={12000}
                placeholder="I just finished my B.S. in Statistics at Ohio State (May 2026). Last summer I interned at Acme Corp, where I built Excel dashboards for the sales team…"
                onChange={(e) => setStory(e.target.value)}
                onBlur={() => setQaState({ ...qa, mode: "story", story })}
                hint={`${story.trim().split(/\s+/).filter(Boolean).length} words. More detail means fewer follow-up questions. Include your name and email if you like.`}
              />
              <details className="text-sm">
                <summary className="cursor-pointer font-medium text-ink underline underline-offset-2">Not sure what to write? Ideas to cover</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
                  {STORY_PROMPTS.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </details>
              <PageTargetPicker value={r.pageTarget} onChange={(n) => setContent({ ...r, pageTarget: clampPages(n) })} compact />
            </Card>

            {error && <div className="mt-4"><Notice tone="bad">{error}</Notice></div>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button size="lg" disabled={busy || story.trim().length < 40 || aiEnabled === false} onClick={() => ask([], story)}>
                {busy ? "Reading your story…" : "Build my draft →"}
              </Button>
              <button type="button" className="text-sm text-muted underline" onClick={useGuided}>
                I&apos;d rather fill in a step-by-step form
              </button>
            </div>
            {story.trim().length > 0 && story.trim().length < 40 && <p className="mt-2 text-xs text-muted">Write a few sentences to get started.</p>}
          </>
        ) : (
          <>
            <h1 className="mt-2 text-[30px] font-semibold text-ink sm:text-[36px]">Your career coach</h1>
            <p className="mt-1 text-sm text-muted">Answer in your own words. Skip anything you&apos;d rather not share. Your draft updates on the right.</p>

            <div className="mt-4 max-h-[60vh] space-y-3 overflow-y-auto rounded-2xl border border-hairline bg-white p-4" aria-live="polite">
              <div className="rounded-xl bg-grey-50 p-3 text-sm">
                <div className="mb-1 text-xs font-medium text-muted">Your story</div>
                <p className="line-clamp-4 whitespace-pre-wrap text-ink">{story}</p>
              </div>
              {chat.map((t, i) => (
                <div key={i} className={t.role === "user" ? "flex justify-end" : ""}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${t.role === "user" ? "bg-ink text-white" : "bg-grey-100 text-ink"}`}>
                    <p className="whitespace-pre-wrap">{t.text}</p>
                    {t.why && <p className="mt-1 text-xs opacity-75">Why: {t.why}</p>}
                  </div>
                </div>
              ))}
              {busy && <p className="text-sm text-muted">Coach is updating your draft…</p>}
              <div ref={endRef} />
            </div>

            {lastReport && (lastReport.added.length > 0 || lastReport.blocked.length > 0) && (
              <div className="mt-3 space-y-2 text-sm">
                {lastReport.added.length > 0 && (
                  <p className="text-muted">
                    <Badge tone="ok">Added</Badge> {lastReport.added.join(" · ")}
                  </p>
                )}
                {lastReport.blocked.length > 0 && (
                  <Notice tone="warn">
                    We left out {lastReport.blocked.length} AI suggestion{lastReport.blocked.length > 1 ? "s" : ""} because they contained numbers you
                    didn&apos;t give us. Add the real figure yourself if you know it.
                  </Notice>
                )}
              </div>
            )}
            {error && <div className="mt-3"><Notice tone="bad">{error}</Notice></div>}

            <form
              className="mt-4"
              onSubmit={(e) => {
                e.preventDefault();
                send(answer);
              }}
            >
              <TextArea
                label="Your answer"
                rows={3}
                value={answer}
                maxLength={4000}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(answer);
                  }
                }}
                disabled={busy}
                placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <Button type="submit" disabled={busy || !answer.trim()}>Send</Button>
                  <Button type="button" variant="ghost" disabled={busy} onClick={() => send("I'd rather skip this one.")}>Skip question</Button>
                </div>
                <Button type="button" variant={ready ? "primary" : "secondary"} onClick={finish} disabled={busy}>
                  {ready ? "Review my resume →" : "I'm done, review my resume →"}
                </Button>
              </div>
            </form>
          </>
        )}
        <p className="mt-4 text-xs text-muted">
          Your answers save automatically. <Link href="/dashboard" className="underline">Leave and come back later</Link>.
        </p>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">Your draft</h2>
          {pending > 0 && <span className="text-xs text-muted">{pending} to confirm later</span>}
        </div>
        <ResumePreview resume={r} />
      </aside>
    </div>
  );
}
