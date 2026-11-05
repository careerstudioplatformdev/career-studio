import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ResumeLayout } from "./layout";

// US Letter, single column, standard fonts: easy for ATS to read.
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_X = 54;
const MARGIN_Y = 50;
const WIDTH = PAGE_W - MARGIN_X * 2;

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

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = toWinAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(next, size) <= maxWidth) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export async function buildPdf(layout: ResumeLayout): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${layout.name} Resume`);
  doc.setCreator("Career Studio");
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);

  let page: PDFPage = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - MARGIN_Y;

  const ensure = (h: number) => {
    if (y - h < MARGIN_Y) {
      page = doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - MARGIN_Y;
    }
  };

  const draw = (text: string, font: PDFFont, size: number, x = MARGIN_X) => {
    page.drawText(toWinAnsi(text), { x, y, size, font, color: rgb(0.1, 0.1, 0.1) });
  };

  const centered = (text: string, font: PDFFont, size: number) => {
    for (const l of wrap(text, font, size, WIDTH)) {
      ensure(size + 4);
      draw(l, font, size, MARGIN_X + (WIDTH - font.widthOfTextAtSize(l, size)) / 2);
      y -= size + 4;
    }
  };

  centered(layout.name, bold, 18);
  if (layout.contactLine) centered(layout.contactLine, regular, 9.5);
  y -= 6;

  for (const section of layout.sections) {
    ensure(30);
    y -= 8;
    draw(section.title.toUpperCase(), bold, 11);
    y -= 4;
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_W - MARGIN_X, y },
      thickness: 0.6,
      color: rgb(0.6, 0.6, 0.6),
    });
    y -= 13;

    if (section.text) {
      for (const l of wrap(section.text, regular, 10, WIDTH)) {
        ensure(14);
        draw(l, regular, 10);
        y -= 13;
      }
    }

    for (const entry of section.entries ?? []) {
      ensure(28);
      y -= 2;
      const dates = toWinAnsi(entry.dates);
      const datesW = dates ? regular.widthOfTextAtSize(dates, 10) : 0;
      const headLines = wrap(entry.heading, bold, 10.5, WIDTH - datesW - 12);
      headLines.forEach((l, idx) => {
        ensure(14);
        draw(l, bold, 10.5);
        if (idx === 0 && dates) draw(dates, regular, 10, PAGE_W - MARGIN_X - datesW);
        y -= 13;
      });
      if (entry.subheading) {
        for (const l of wrap(entry.subheading, italic, 10, WIDTH)) {
          ensure(14);
          draw(l, italic, 10);
          y -= 13;
        }
      }
      for (const b of entry.bullets) {
        const lines = wrap(b, regular, 10, WIDTH - 14);
        lines.forEach((l, idx) => {
          ensure(14);
          if (idx === 0) draw("-", regular, 10, MARGIN_X + 3);
          draw(l, regular, 10, MARGIN_X + 14);
          y -= 13;
        });
      }
      y -= 3;
    }
  }

  return doc.save();
}
