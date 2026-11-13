"use client";

import { useEffect, useState } from "react";

export class AiCallError extends Error {
  constructor(
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

/** POST to one of our /api/ai routes and return the JSON, or throw a friendly error. */
export async function callAi<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/ai/${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new AiCallError("Couldn't reach Career Studio. Check your connection and try again.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AiCallError(data.error ?? "Something went wrong. Please try again.", data.code);
  return data as T;
}

let cached: boolean | null = null;

/** Whether AI assist is switched on for this deployment (null while checking). */
export function useAiEnabled(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(cached);
  useEffect(() => {
    if (cached !== null) return;
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((d) => {
        cached = Boolean(d.enabled);
        setEnabled(cached);
      })
      .catch(() => setEnabled(false));
  }, []);
  return enabled;
}
