"use client";

import { useMemo } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { fScan } from "@/lib/resume/fscan";
import { extractKeywords } from "@/lib/resume/jd-match";
import { buildLayout } from "@/lib/resume/layout";
import { fitToPages } from "@/lib/resume/length";
import type { ResumeContent } from "@/lib/resume/types";

export function FScanPanel({
  resume,
  jobDescription,
  overlay,
  onToggleOverlay,
}: {
  resume: ResumeContent;
  jobDescription: string;
  overlay: boolean;
  onToggleOverlay: () => void;
}) {
  const result = useMemo(() => {
    const layout = fitToPages(buildLayout(resume), resume.pageTarget).layout;
    const keywords = jobDescription.trim().length > 40 ? extractKeywords(jobDescription, 12) : [];
    return fScan(layout, resume.targetRole, keywords);
  }, [resume, jobDescription]);
  const tone = result.score >= 75 ? "ok" : result.score >= 50 ? "warn" : "bad";

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">Recruiter Gaze F-Scan</h3>
          <p className="max-w-prose text-sm text-muted">
            Recruiters skim in an &quot;F&quot; shape: across the top, across your most recent role, then down the left edge. This checks
            what they see in those few seconds{jobDescription.trim() ? ", using the job you're targeting" : ""}.
          </p>
        </div>
        <div className={`text-3xl font-bold ${tone === "ok" ? "text-ok" : tone === "warn" ? "text-warn" : "text-bad"}`}>
          {result.score}
          <span className="text-base font-medium text-muted">/100</span>
        </div>
      </div>
      <Button variant="secondary" size="sm" className="mt-3" onClick={onToggleOverlay} aria-pressed={overlay}>
        {overlay ? "Hide gaze overlay" : "Show gaze overlay on preview"}
      </Button>
      <div className="mt-4 space-y-4">
        {result.zones.map((z) => (
          <div key={z.key}>
            <div className="flex items-center justify-between text-sm font-medium">
              <span>{z.name}</span>
              <Badge tone={z.points === z.max ? "ok" : z.points > 0 ? "warn" : "bad"}>
                {z.points}/{z.max}
              </Badge>
            </div>
            <p className="text-xs text-muted">{z.description}</p>
            <ul className="mt-1 space-y-1">
              {z.findings.map((f) => (
                <li key={f.text} className="flex gap-2 text-sm">
                  <span aria-hidden className={f.ok ? "text-ok" : "text-warn"}>{f.ok ? "✓" : "!"}</span>
                  <span>
                    <span className="sr-only">{f.ok ? "Good: " : "Improve: "}</span>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Card>
  );
}
