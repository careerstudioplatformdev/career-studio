"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { downloadBlob } from "@/lib/download";
import { Button, Card, Notice } from "./ui";

export function AccountControls() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportData() {
    setBusy("export");
    setError(null);
    const supabase = createClient();
    const [profile, resumes, versions, events] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("resumes").select("*"),
      supabase.from("resume_versions").select("*"),
      supabase.from("audit_events").select("*"),
    ]);
    const err = profile.error || resumes.error || versions.error || events.error;
    if (err) {
      setBusy(null);
      return setError(err.message);
    }
    await supabase.from("audit_events").insert({ action: "data_exported", details: {} });
    const payload = {
      exported_at: new Date().toISOString(),
      profile: profile.data,
      resumes: resumes.data,
      resume_versions: versions.data,
      audit_events: events.data,
    };
    downloadBlob(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }), "career-studio-data.json");
    setBusy(null);
  }

  async function deleteAccount() {
    if (!window.confirm("Delete your account and all resumes permanently? This can't be undone.")) return;
    setBusy("delete");
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setBusy(null);
      return setError(error.message);
    }
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      {error && <Notice tone="bad">{error}</Notice>}
      <Card>
        <h2 className="font-semibold text-ink">Download my data</h2>
        <p className="mt-1 text-sm text-muted">Everything we store about you, as a JSON file.</p>
        <Button variant="secondary" className="mt-3" onClick={exportData} disabled={busy !== null}>
          {busy === "export" ? "Preparing…" : "Download my data"}
        </Button>
      </Card>
      <Card>
        <h2 className="font-semibold text-ink">Delete my account</h2>
        <p className="mt-1 text-sm text-muted">Permanently deletes your account, all resumes, versions and activity history.</p>
        <Button variant="danger" className="mt-3" onClick={deleteAccount} disabled={busy !== null}>
          {busy === "delete" ? "Deleting…" : "Delete my account"}
        </Button>
      </Card>
    </div>
  );
}
