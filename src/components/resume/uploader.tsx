"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Notice } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { ParseResult } from "@/lib/resume/parse-text";

export function Uploader() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/parse", { method: "POST", body });
    const json = await res.json().catch(() => ({ error: "Something went wrong reading the file." }));
    if (!res.ok) {
      setBusy(false);
      return setError(json.error ?? "Something went wrong reading the file.");
    }
    const parsed = json as ParseResult;
    const supabase = createClient();
    const title = parsed.resume.contact.fullName ? `${parsed.resume.contact.fullName}'s resume` : file.name.replace(/\.[^.]+$/, "");
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        origin: "upload",
        title,
        content: parsed.resume,
        qa_state: { completed: true, unplaced: parsed.unplaced, warnings: parsed.warnings },
      })
      .select("id")
      .single();
    if (error || !data) {
      setBusy(false);
      return setError(error?.message ?? "Couldn't save your resume.");
    }
    await supabase.from("audit_events").insert({
      resume_id: data.id,
      action: "resume_created",
      details: { origin: "upload", file_type: file.name.split(".").pop(), file_stored: false },
    });
    router.push(`/resumes/${data.id}`);
  }

  return (
    <div className="mt-6 space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) setFile(f);
        }}
        className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${dragging ? "border-brand bg-brand-soft" : "border-line bg-white"}`}
      >
        <p className="font-medium text-ink">{file ? file.name : "Drag your resume here"}</p>
        <p className="mt-1 text-sm text-muted">PDF or Word (.docx), up to 5 MB</p>
        <input
          ref={input}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          id="resume-file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label htmlFor="resume-file" className="mt-4 inline-block cursor-pointer rounded-lg border border-line px-4 py-2 text-sm font-medium hover:border-brand hover:text-brand">
          Choose a file
        </label>
      </div>
      {error && <Notice tone="bad">{error}</Notice>}
      <Button size="lg" className="w-full" disabled={!file || busy} onClick={upload}>
        {busy ? "Reading your resume…" : "Upload and review"}
      </Button>
    </div>
  );
}
