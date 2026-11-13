import { StartChoices } from "@/components/start-choices";

const steps = [
  { title: "Tell your story", body: "Write about yourself the way you'd tell a friend, or upload a resume you already have." },
  { title: "Your AI coach drafts it", body: "It asks follow-up questions one at a time and writes achievement-focused bullets, only from what you said." },
  { title: "Seven agents polish it", body: "Three builders, three reviewers and a final approver compare versions. Red flags, F-Scan and length from 1 to 5 pages." },
  { title: "Fit, apply, interview", body: "Match each job description, approve tailored applications, and practice interview questions from your resume." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-14 text-center sm:py-20">
        <p className="mb-3 text-sm font-medium text-brand">Resume Studio</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          Tell us your story. Get a best-in-class resume that&apos;s 100% true.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted">
          Whether it&apos;s your very first resume or your tenth, Career Studio&apos;s AI career coach and seven-agent review
          help you build, check and tailor it. Nothing is made up, and you approve every line.
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
