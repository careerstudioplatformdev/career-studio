import { StartChoices } from "@/components/start-choices";

// Landing spot after sign-up: one click to begin the journey the visitor chose.
export default async function Start({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="text-2xl font-bold text-ink">You&apos;re all set. Let&apos;s begin.</h1>
      <p className="mb-8 mt-1 text-muted">Your progress saves automatically, so you can stop and come back any time.</p>
      <StartChoices only={mode === "upload" ? "upload" : mode === "qa" ? "qa" : undefined} />
    </div>
  );
}
