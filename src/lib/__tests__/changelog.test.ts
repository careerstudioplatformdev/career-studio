import { describe, expect, it } from "vitest";
import { CURRENT_RELEASE, RELEASES, formatReleaseDate } from "../changelog";

const parse = (v: string) => v.split(".").map(Number);
const newer = (a: string, b: string) => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i];
  return false;
};

describe("changelog", () => {
  it("lists releases newest first with unique semver versions", () => {
    expect(new Set(RELEASES.map((r) => r.version)).size).toBe(RELEASES.length);
    for (const r of RELEASES) expect(r.version).toMatch(/^\d+\.\d+\.\d+$/);
    for (let i = 1; i < RELEASES.length; i++) {
      expect(newer(RELEASES[i - 1].version, RELEASES[i].version)).toBe(true);
      expect(RELEASES[i - 1].date >= RELEASES[i].date).toBe(true);
    }
    expect(CURRENT_RELEASE).toBe(RELEASES[0]);
  });

  it("gives every release a title, summary and valid date", () => {
    for (const r of RELEASES) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.summary.length).toBeGreaterThan(0);
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("formats dates without timezone drift", () => {
    expect(formatReleaseDate("2026-11-05")).toBe("November 5, 2026");
  });
});
