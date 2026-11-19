import { startResume } from "@/app/actions";
import { Badge } from "@/components/ui";

const choices = [
  {
    mode: "qa",
    featured: true,
    title: "Create my first resume",
    body: "Tell your story in your own words. An AI career coach turns it into a professional resume. No resume know-how needed.",
  },
  {
    mode: "upload",
    featured: false,
    title: "Upload an existing resume",
    body: "PDF or Word. We pull out your details for you to check and improve.",
  },
];

function Icon({ mode }: { mode: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-5 w-5">
      {mode === "upload" ? (
        <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3" />
      ) : (
        <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" />
      )}
    </svg>
  );
}

export function StartChoices({ only }: { only?: "upload" | "qa" }) {
  const list = only ? choices.filter((c) => c.mode === only) : choices;
  return (
    <div className={`grid max-w-4xl gap-4 ${list.length > 1 ? "[grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]" : ""}`}>
      {list.map((c) => (
        <form key={c.mode} action={startResume}>
          <input type="hidden" name="mode" value={c.mode} />
          <button
            type="submit"
            className={`flex h-full w-full flex-col rounded-2xl bg-white p-6 text-left transition hover:bg-grey-50 ${c.featured && !only ? "border-[1.5px] border-ink" : "border border-hairline hover:border-grey-400"}`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-grey-100 text-ink"><Icon mode={c.mode} /></span>
              {c.featured && !only && <Badge tone="signal">Start here</Badge>}
            </span>
            <span className="mt-5 block font-[family-name:var(--font-display)] text-xl font-semibold tracking-[-0.015em] text-ink">{c.title}</span>
            <span className="mt-1.5 block text-[15px] leading-relaxed text-grey-600">{c.body}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
