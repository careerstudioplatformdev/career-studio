import { Badge, Card } from "@/components/ui";
import { MODULES, PLATFORM, STATUS_TEXT, type FeatureStatus, type RoadmapFeature } from "@/lib/roadmap";

export const metadata = { title: "Roadmap · Career Studio" };

const TONE: Record<FeatureStatus, "ok" | "brand" | "warn" | "neutral"> = { live: "ok", partial: "brand", next: "warn", later: "neutral" };

function FeatureList({ features }: { features: RoadmapFeature[] }) {
  return (
    <ul className="mt-3 divide-y divide-line">
      {features.map((f) => (
        <li key={f.name} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-start sm:gap-3">
          <span className="w-28 shrink-0"><Badge tone={TONE[f.status]}>{STATUS_TEXT[f.status]}</Badge></span>
          <span>
            <span className="font-medium text-ink">{f.name}</span>
            {f.detail && <span className="block text-sm text-muted">{f.detail}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function Roadmap() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">Roadmap</h1>
      <p className="mt-1 max-w-2xl text-muted">
        Career Studio helps you build a career, not just a resume: Build → Optimize → Find jobs → Apply → Network → Prepare →
        Connect → Get hired. Eight connected modules, built one stage at a time.
      </p>
      <div className="mt-8 space-y-4">
        {MODULES.map((m) => (
          <Card key={m.number}>
            <div className="text-sm font-semibold text-brand">Module {m.number}</div>
            <h2 className="text-lg font-semibold text-ink">{m.name}</h2>
            <p className="text-sm text-muted">{m.goal}</p>
            <FeatureList features={m.features} />
          </Card>
        ))}
        <Card>
          <h2 className="text-lg font-semibold text-ink">Across the platform</h2>
          <FeatureList features={PLATFORM} />
        </Card>
      </div>
    </div>
  );
}
