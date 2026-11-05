import { Badge, Card } from "@/components/ui";
import { CURRENT_RELEASE, RELEASES, formatReleaseDate, type Release } from "@/lib/changelog";

export const metadata = { title: "What's new · Career Studio" };

function ChangeList({ label, tone, items }: { label: string; tone: "ok" | "brand" | "warn"; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-4">
      <Badge tone={tone}>{label}</Badge>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}

function ReleaseBody({ release }: { release: Release }) {
  return (
    <>
      <p className="mt-2 text-muted">{release.summary}</p>
      <ChangeList label="New" tone="ok" items={release.added} />
      <ChangeList label="Improved" tone="brand" items={release.improved} />
      <ChangeList label="Fixed" tone="warn" items={release.fixed} />
    </>
  );
}

export default function WhatsNew() {
  const previous = RELEASES.slice(1);
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-ink">What&apos;s new</h1>
      <p className="mt-1 text-muted">What changed in each version of Career Studio.</p>

      <Card className="mt-6 border-brand/40">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">Latest · v{CURRENT_RELEASE.version}</Badge>
          <span className="text-sm text-muted">{formatReleaseDate(CURRENT_RELEASE.date)}</span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-ink">{CURRENT_RELEASE.title}</h2>
        {previous[0] && <p className="text-sm text-muted">Changes since v{previous[0].version}</p>}
        <ReleaseBody release={CURRENT_RELEASE} />
      </Card>

      {previous.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-lg font-semibold text-ink">Earlier versions</h2>
          <ol className="space-y-4">
            {previous.map((r) => (
              <li key={r.version}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>v{r.version}</Badge>
                    <span className="text-sm text-muted">{formatReleaseDate(r.date)}</span>
                  </div>
                  <h3 className="mt-2 font-semibold text-ink">{r.title}</h3>
                  <ReleaseBody release={r} />
                </Card>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
