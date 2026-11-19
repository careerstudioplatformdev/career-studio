import { StartChoices } from "@/components/start-choices";
import { Eyebrow } from "@/components/ui";

const steps = [
  { title: "Tell your story", body: "Write about yourself the way you'd tell a friend, or upload a resume you already have. \"I'm not sure yet\" is a perfectly good answer." },
  { title: "Your AI coach drafts it", body: "It asks follow-up questions one at a time and writes achievement-focused bullets, only from what you said." },
  { title: "Seven agents polish it", body: "Three builders, three reviewers and a final approver compare versions. Red flags, F-Scan and length from 1 to 5 pages." },
  { title: "Fit, apply, interview", body: "Match each job description, approve tailored applications, and practice interview questions from your resume." },
];

export default function Home() {
  return (
    <div className="mx-auto max-w-[1200px] px-6">
      <section className="py-20 sm:py-[88px]">
        <Eyebrow>Resume Studio</Eyebrow>
        <h1 className="mt-5 max-w-4xl text-[40px] sm:text-[56px]">
          Tell us your story. <span className="text-grey-500">Get a best-in-class resume that&apos;s 100% true.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-grey-600">
          Whether it&apos;s your very first resume or your tenth, Career Studio&apos;s AI career coach and seven-agent review
          help you build, check and tailor it. Nothing is made up, and you approve every line.
        </p>
        <div className="mt-12">
          <StartChoices />
        </div>
      </section>

      <section className="border-t border-hairline py-20" aria-labelledby="how-it-works">
        <Eyebrow>How it works</Eyebrow>
        <h2 id="how-it-works" className="mt-4 text-[30px] sm:text-[36px]">One question at a time.</h2>
        <ol className="mt-10 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-hairline bg-white p-6">
              <div className="text-[13px] font-medium tabular-nums text-grey-500">{String(i + 1).padStart(2, "0")}</div>
              <h3 className="mt-3 text-xl">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-grey-600">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
