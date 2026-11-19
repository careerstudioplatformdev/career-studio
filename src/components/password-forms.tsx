"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { friendly } from "./auth-form";
import { Button, Field, Notice } from "./ui";

export function ForgotPasswordForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent("/reset-password")}`,
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-3">
        <Notice tone="ok">
          If there&apos;s an account for <strong>{email}</strong>, we&apos;ve sent a link to reset your password. It may take a few
          minutes; check your spam folder too.
        </Notice>
        <p className="text-sm"><Link href="/login" className="font-medium text-orange-ink underline underline-offset-2">Back to log in</Link></p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      {error && <Notice tone="bad">{error}</Notice>}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</Button>
      <p className="text-center text-sm text-muted">
        Remembered it? <Link href="/login" className="font-medium text-orange-ink underline underline-offset-2">Log in</Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (error) {
      return setError(
        /session|not authenticated|jwt/i.test(error.message)
          ? "This reset link has expired or was already used. Please request a new one."
          : friendly(error.message),
      );
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="New password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} />
      <Field label="Repeat new password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {error && (
        <Notice tone="bad">
          {error}{" "}
          {/expired/.test(error) && <Link href="/forgot-password" className="font-medium underline">Get a new link</Link>}
        </Notice>
      )}
      <Button type="submit" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save new password"}</Button>
    </form>
  );
}
