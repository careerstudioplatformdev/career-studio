import { startResume } from "@/app/actions";

const choices = [
  {
    mode: "upload",
    icon: "⬆",
    title: "Upload an existing resume",
    body: "PDF or Word. We pull out your details for you to check and improve.",
  },
  {
    mode: "qa",
    icon: "✎",
    title: "Create my first resume",
    body: "Answer guided questions. Great for students, career changers and returners.",
  },
];

export function StartChoices({ only }: { only?: "upload" | "qa" }) {
  const list = only ? choices.filter((c) => c.mode === only) : choices;
  return (
    <div className={`mx-auto grid max-w-3xl gap-4 ${list.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {list.map((c) => (
        <form key={c.mode} action={startResume}>
          <input type="hidden" name="mode" value={c.mode} />
          <button
            type="submit"
            className="group h-full w-full rounded-2xl border-2 border-line bg-white p-6 text-left transition hover:border-brand hover:shadow-md"
          >
            <span className="mb-3 grid h-11 w-11 place-items-center rounded-lg bg-brand-soft text-xl" aria-hidden>{c.icon}</span>
            <span className="block text-lg font-semibold text-ink group-hover:text-brand">{c.title}</span>
            <span className="mt-1 block text-sm text-muted">{c.body}</span>
          </button>
        </form>
      ))}
    </div>
  );
}
