import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { ResumeLayout } from "./layout";
import { planPdf, PAGE_H, PAGE_W, MARGIN_X, type FontKey } from "./pdf-plan";

export { toWinAnsi } from "./pdf-plan";

// US Letter, single column, standard fonts: easy for ATS to read.
// Positions come from planPdf, the same plan the length control uses.
export async function buildPdf(layout: ResumeLayout): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`${layout.name} Resume`);
  doc.setCreator("Career Studio");
  const fonts: Record<FontKey, PDFFont> = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
  };

  const plan = planPdf(layout, (text, font, size) => fonts[font].widthOfTextAtSize(text, size));
  const color = rgb(0.1, 0.1, 0.1);

  plan.pages.forEach((ops, i) => {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    for (const op of ops) {
      if (op.kind === "text") page.drawText(op.text, { x: op.x, y: op.y, size: op.size, font: fonts[op.font], color });
      else page.drawLine({ start: { x: MARGIN_X, y: op.y }, end: { x: PAGE_W - MARGIN_X, y: op.y }, thickness: 0.6, color: rgb(0.6, 0.6, 0.6) });
    }
    // Multi-page resumes: name and page number in the footer so loose pages stay together.
    if (plan.pages.length > 1) {
      const label = `${layout.name ? `${layout.name} - ` : ""}Page ${i + 1} of ${plan.pages.length}`.replace(/[^\x20-\x7E\xA0-\xFF]/g, "");
      page.drawText(label, { x: PAGE_W - MARGIN_X - fonts.regular.widthOfTextAtSize(label, 8), y: 24, size: 8, font: fonts.regular, color: rgb(0.45, 0.45, 0.45) });
    }
  });

  return doc.save();
}
