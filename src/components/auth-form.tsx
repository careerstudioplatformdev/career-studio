"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, Notice } from "./ui";

export const CONSENT_VERSION = "2026-11-05";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, consent_version: CONSENT_VERSION },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) return setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(error.message);
    }
    router.replace(next);
    router.refresh();
  }

  if (checkEmail) {
    return (
      <Notice tone="ok">
        Check your inbox at <strong>{email}</strong> and click the link to finish creating your account.
      </Notice>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <Field label="Full name" autoComplete="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      )}
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      <Field
        label="Password"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        minLength={8}
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        hint={mode === "signup" ? "At least 8 characters." : undefined}
      />
      {mode === "signup" && (
        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>
            I agree that Career Studio may store and process my resume information to provide this service, as described in the{" "}
            <Link href="/privacy" className="text-brand underline">privacy notice</Link>. I can download or delete my data at any time.
          </span>
        </label>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      <Button type="submit" className="w-full" disabled={busy || (mode === "signup" && !consent)}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-brand">Log in</Link></>
        ) : (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
