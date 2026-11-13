// Page plan for the PDF export: where every line goes and where pages break.
// Shared by the exporter and by length control, so "fits on N pages" is exact.

import type { ResumeLayout } from "./layout";

export const PAGE_W = 612;
export const PAGE_H = 792;
export const MARGIN_X = 54;
export const MARGIN_Y = 50;
const WIDTH = PAGE_W - MARGIN_X * 2;

export type FontKey = "regular" | "bold" | "italic";
export type Measure = (text: string, font: FontKey, size: number) => number;
export type DrawOp = { kind: "text"; text: string; x: number; y: number; size: number; font: FontKey } | { kind: "rule"; y: number };
export type PdfPlan = { pages: DrawOp[][]; lastY: number };

/** Standard PDF fonts only support WinAnsi; replace characters they can't draw. */
export function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/[•●▪]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
}

function wrap(text: string, measure: Measure, font: FontKey, size: number, maxWidth: number): string[] {
  const words = toWinAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (measure(next, font, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function planPdf(layout: ResumeLayout, measure: Measure): PdfPlan {
  const pages: DrawOp[][] = [[]];
  let y = PAGE_H - MARGIN_Y;

  const ensure = (h: number) => {
    if (y - h < MARGIN_Y) {
      pages.push([]);
      y = PAGE_H - MARGIN_Y;
    }
  };
  const draw = (text: string, font: FontKey, size: number, x = MARGIN_X) => {
    pages[pages.length - 1].push({ kind: "text", text: toWinAnsi(text), x, y, size, font });
  };
  const centered = (text: string, font: FontKey, size: number) => {
    for (const l of wrap(text, measure, font, size, WIDTH)) {
      ensure(size + 4);
      draw(l, font, size, MARGIN_X + (WIDTH - measure(l, font, size)) / 2);
      y -= size + 4;
    }
  };

  centered(layout.name, "bold", 18);
  if (layout.contactLine) centered(layout.contactLine, "regular", 9.5);
  y -= 6;

  for (const section of layout.sections) {
    ensure(30);
    y -= 8;
    draw(section.title.toUpperCase(), "bold", 11);
    y -= 4;
    pages[pages.length - 1].push({ kind: "rule", y });
    y -= 13;

    if (section.text) {
      for (const l of wrap(section.text, measure, "regular", 10, WIDTH)) {
        ensure(14);
        draw(l, "regular", 10);
        y -= 13;
      }
    }

    for (const entry of section.entries ?? []) {
      ensure(28);
      y -= 2;
      const dates = toWinAnsi(entry.dates);
      const datesW = dates ? measure(dates, "regular", 10) : 0;
      wrap(entry.heading, measure, "bold", 10.5, WIDTH - datesW - 12).forEach((l, idx) => {
        ensure(14);
        draw(l, "bold", 10.5);
        if (idx === 0 && dates) draw(dates, "regular", 10, PAGE_W - MARGIN_X - datesW);
        y -= 13;
      });
      if (entry.subheading) {
        for (const l of wrap(entry.subheading, measure, "italic", 10, WIDTH)) {
          ensure(14);
          draw(l, "italic", 10);
          y -= 13;
        }
      }
      for (const b of entry.bullets) {
        wrap(b, measure, "regular", 10, WIDTH - 14).forEach((l, idx) => {
          ensure(14);
          if (idx === 0) draw("-", "regular", 10, MARGIN_X + 3);
          draw(l, "regular", 10, MARGIN_X + 14);
          y -= 13;
        });
      }
      y -= 3;
    }
  }

  return { pages, lastY: y };
}

/** Pages used, with the last page as a fraction (e.g. 1.4). */
export function pagesUsed(plan: PdfPlan): number {
  const usable = PAGE_H - 2 * MARGIN_Y;
  const lastFill = Math.min(1, Math.max(0, (PAGE_H - MARGIN_Y - plan.lastY) / usable));
  return plan.pages.length - 1 + lastFill;
}
