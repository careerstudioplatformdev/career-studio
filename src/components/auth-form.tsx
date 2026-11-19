"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Field, LinkButton, Notice } from "./ui";

export const CONSENT_VERSION = "2026-11-05";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/** Plain-language versions of common auth errors. */
export function friendly(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again, or reset your password.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first. Look for our email, or sign up again to get a new link.";
  if (/rate limit|too many/i.test(message)) return "Too many emails were sent just now. Please wait a few minutes and try again.";
  if (/sending.*email|smtp/i.test(message)) return "We couldn't send the email right now. Please try again in a few minutes.";
  return message;
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
  const [error, setError] = useState<string | null>(
    params.get("error") === "confirm" ? "That email link has expired or was already used. Log in, or request a new link." : null,
  );
  const [checkEmail, setCheckEmail] = useState(false);
  const [existing, setExisting] = useState(false);
  const [resent, setResent] = useState<"idle" | "sending" | "sent">("idle");

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
      if (error) return setError(friendly(error.message));
      // Supabase returns a user with no identities when the email is already registered,
      // and sends no email (so accounts can't be probed). Tell the person what to do instead.
      if (data.user && data.user.identities?.length === 0) return setExisting(true);
      if (!data.session) return setCheckEmail(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setError(friendly(error.message));
    }
    router.replace(next);
    router.refresh();
  }

  async function resend() {
    setResent("sending");
    const { error } = await createClient().auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}` },
    });
    if (error) {
      setResent("idle");
      return setError(friendly(error.message));
    }
    setResent("sent");
  }

  if (existing) {
    return (
      <div className="space-y-4">
        <Notice tone="info">
          There&apos;s already an account for <strong>{email}</strong>, so we didn&apos;t send a new email. Log in instead, or reset
          your password if you&apos;ve forgotten it.
        </Notice>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/login?next=${encodeURIComponent(next)}`}>Log in</LinkButton>
          <LinkButton href={`/forgot-password?email=${encodeURIComponent(email)}`} variant="secondary">Reset password</LinkButton>
        </div>
      </div>
    );
  }

  if (checkEmail) {
    return (
      <div className="space-y-4">
        <Notice tone="ok">
          Check your inbox at <strong>{email}</strong> and click the link to finish creating your account.
        </Notice>
        <p className="text-sm text-muted">
          Nothing after a few minutes? Check your spam or promotions folder.
        </p>
        {error && <Notice tone="bad">{error}</Notice>}
        <Button variant="secondary" onClick={resend} disabled={resent !== "idle"}>
          {resent === "sending" ? "Sending…" : resent === "sent" ? "Email sent again" : "Resend email"}
        </Button>
      </div>
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
            <Link href="/privacy" className="font-medium text-orange-ink underline underline-offset-2">privacy notice</Link>. I can download or delete my data at any time.
          </span>
        </label>
      )}
      {error && <Notice tone="bad">{error}</Notice>}
      {mode === "login" && (
        <p className="-mt-1 text-right text-sm">
          <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`} className="font-medium text-orange-ink underline underline-offset-2">
            Forgot password?
          </Link>
        </p>
      )}
      <Button type="submit" className="w-full" disabled={busy || (mode === "signup" && !consent)}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-orange-ink underline underline-offset-2">Log in</Link></>
        ) : (
          <>New here? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-orange-ink underline underline-offset-2">Create an account</Link></>
        )}
      </p>
    </form>
  );
}
