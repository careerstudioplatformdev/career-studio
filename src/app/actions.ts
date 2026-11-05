"use server";

import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { emptyResume } from "@/lib/resume/factory";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createQaResume() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .insert({ origin: "qa", title: "My first resume", content: emptyResume(), qa_state: { step: "level" } })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create resume");
  await supabase.from("audit_events").insert({ resume_id: data.id, action: "resume_created", details: { origin: "qa" } });
  redirect(`/resumes/${data.id}/build`);
}

/** Start either journey from a button. Signed-out visitors sign up first. */
export async function startResume(formData: FormData) {
  const mode = formData.get("mode") === "upload" ? "upload" : "qa";
  const user = await getCurrentUser();
  if (!user) redirect(`/signup?next=${encodeURIComponent(`/start?mode=${mode}`)}`);
  if (mode === "upload") redirect("/resumes/upload");
  await createQaResume();
}
