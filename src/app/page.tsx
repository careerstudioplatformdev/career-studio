import { StartChoices } from "@/components/start-choices";

const steps = [
  { title: "Start your way", body: "Upload a resume you have, or answer simple questions to build your first one." },
  { title: "Check every fact", body: "You confirm each detail. We flag gaps and date problems, and never make things up." },
  { title: "Make it stronger", body: "See a clear quality score, compare against a job posting, and fix what matters." },
  { title: "Download and apply", body: "Export a clean, ATS-friendly Word or PDF file once you've approved it." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 text-center sm:py-20">
        <p className="mb-3 text-sm font-medium text-brand">Resume Studio</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          A resume that&apos;s honest, clear and ready for applicant tracking systems.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Whether you&apos;re updating an old resume or writing your very first one, Career Studio guides you
          step by step, and every fact stays yours.
        </p>

        <div className="mt-10">
          <StartChoices />
        </div>
      </section>

      <section className="grid gap-4 pb-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-xl border border-line bg-white p-5">
            <div className="mb-2 text-sm font-semibold text-brand">Step {i + 1}</div>
            <h2 className="font-semibold text-ink">{s.title}</h2>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
