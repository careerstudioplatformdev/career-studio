import Link from "next/link";
import { StartChoices } from "@/components/start-choices";
import { Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard() {
  const supabase = await createClient();
  const { data: resumes } = await supabase
    .from("resumes")
    .select("id, title, origin, status, qa_state, updated_at")
    .order("updated_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">My resumes</h1>

      {resumes && resumes.length > 0 ? (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-xl border border-line bg-white">
          {resumes.map((r) => {
            const inQa = r.origin === "qa" && !r.qa_state?.completed;
            return (
              <li key={r.id}>
                <Link
                  href={inQa ? `/resumes/${r.id}/build` : `/resumes/${r.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-canvas"
                >
                  <div>
                    <div className="font-medium text-ink">{r.title}</div>
                    <div className="text-sm text-muted">
                      {r.origin === "qa" ? "Built from questions" : "Uploaded"} · Updated{" "}
                      {new Date(r.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                  {r.status === "approved" ? (
                    <Badge tone="ok">Approved</Badge>
                  ) : inQa ? (
                    <Badge tone="brand">In progress</Badge>
                  ) : (
                    <Badge>Draft</Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 text-muted">You don&apos;t have any resumes yet. Pick how you&apos;d like to start.</p>
      )}

      <h2 className="mb-4 mt-10 text-lg font-semibold text-ink">Start a new resume</h2>
      <StartChoices />
    </div>
  );
}
