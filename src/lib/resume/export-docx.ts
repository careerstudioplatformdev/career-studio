import { AlignmentType, BorderStyle, Document, Packer, Paragraph, TabStopType, TextRun } from "docx";
import type { ResumeLayout } from "./layout";

const FONT = "Calibri";

export function buildDocx(layout: ResumeLayout): Document {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: layout.name, bold: true, size: 32, font: FONT })],
    }),
  );
  if (layout.contactLine) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: layout.contactLine, size: 20, font: FONT })],
      }),
    );
  }

  for (const section of layout.sections) {
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
        children: [new TextRun({ text: section.title.toUpperCase(), bold: true, size: 22, font: FONT })],
      }),
    );
    if (section.text) {
      children.push(new Paragraph({ children: [new TextRun({ text: section.text, size: 21, font: FONT })] }));
    }
    for (const entry of section.entries ?? []) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          tabStops: [{ type: TabStopType.RIGHT, position: 10080 }],
          children: [
            new TextRun({ text: entry.heading, bold: true, size: 21, font: FONT }),
            ...(entry.dates ? [new TextRun({ text: `\t${entry.dates}`, size: 21, font: FONT })] : []),
          ],
        }),
      );
      if (entry.subheading) {
        children.push(
          new Paragraph({ children: [new TextRun({ text: entry.subheading, italics: true, size: 21, font: FONT })] }),
        );
      }
      for (const b of entry.bullets) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            children: [new TextRun({ text: b, size: 21, font: FONT })],
          }),
        );
      }
    }
  }

  return new Document({
    creator: "Career Studio",
    title: `${layout.name} Resume`,
    sections: [
      {
        properties: { page: { margin: { top: 720, bottom: 720, left: 1080, right: 1080 } } },
        children,
      },
    ],
  });
}

export async function docxBlob(layout: ResumeLayout): Promise<Blob> {
  return Packer.toBlob(buildDocx(layout));
}

export async function docxBuffer(layout: ResumeLayout): Promise<Uint8Array> {
  return new Uint8Array(await Packer.toBuffer(buildDocx(layout)));
}
