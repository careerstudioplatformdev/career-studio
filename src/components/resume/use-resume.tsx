"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { normalizeResume } from "@/lib/resume/factory";
import type { QaState, ResumeContent, ResumeRow } from "@/lib/resume/types";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

type Patch = { content?: ResumeContent; qa_state?: QaState; title?: string; status?: ResumeRow["status"] };

/** Loads a resume and autosaves changes shortly after the user stops typing. */
export function useResume(id: string) {
  const [row, setRow] = useState<ResumeRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const pending = useRef<Patch>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let active = true;
    supabase
      .from("resumes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) return setLoadError(error?.message ?? "Resume not found");
        setRow({ ...data, content: normalizeResume(data.content), qa_state: data.qa_state ?? {} } as ResumeRow);
      });
    return () => {
      active = false;
    };
  }, [id, supabase]);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    if (Object.keys(patch).length === 0) return true;
    pending.current = {};
    setSaveStatus("saving");
    const { error } = await supabase.from("resumes").update(patch).eq("id", id);
    if (error) {
      pending.current = { ...patch, ...pending.current };
      setSaveStatus("error");
      return false;
    }
    setSaveStatus("saved");
    return true;
  }, [id, supabase]);

  const queue = useCallback(
    (patch: Patch) => {
      pending.current = { ...pending.current, ...patch };
      setSaveStatus("saving");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 700);
    },
    [flush],
  );

  // Save before the tab closes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.keys(pending.current).length > 0) {
        void flush();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => {
      window.removeEventListener("beforeunload", handler);
      void flush();
    };
  }, [flush]);

  const setContent = useCallback(
    (content: ResumeContent) => {
      setRow((r) => {
        if (!r) return r;
        // Any change after approval needs a fresh approval.
        const status = r.status === "approved" ? "draft" : r.status;
        queue(status !== r.status ? { content, status } : { content });
        return { ...r, content, status };
      });
    },
    [queue],
  );

  const setQaState = useCallback(
    (qa_state: QaState) => {
      setRow((r) => (r ? { ...r, qa_state } : r));
      queue({ qa_state });
    },
    [queue],
  );

  const setTitle = useCallback(
    (title: string) => {
      setRow((r) => (r ? { ...r, title } : r));
      queue({ title });
    },
    [queue],
  );

  const markApproved = useCallback(() => {
    setRow((r) => (r ? { ...r, status: "approved", approved_at: new Date().toISOString() } : r));
  }, []);

  return { row, loadError, saveStatus, setContent, setQaState, setTitle, flush, markApproved, supabase };
}

export function SaveIndicator({ status }: { status: SaveStatus }) {
  const text = { idle: "", saving: "Saving…", saved: "All changes saved", error: "Couldn't save. Retrying when you edit again." }[status];
  return (
    <span role="status" aria-live="polite" className={`text-xs ${status === "error" ? "text-bad" : "text-muted"}`}>
      {text}
    </span>
  );
}
