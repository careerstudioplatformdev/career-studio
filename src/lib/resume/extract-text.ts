import "server-only";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type FileKind = "pdf" | "docx";

/** Identify the file from its first bytes, not just its name. */
export function detectKind(bytes: Uint8Array): FileKind | null {
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "pdf"; // %PDF
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx"; // zip
  return null;
}

/** Rebuild text lines from PDF text positions (pdf.js returns loose fragments). */
async function pdfText(bytes: Uint8Array): Promise<string> {
  const { extractTextItems } = await import("unpdf");
  const { items } = await extractTextItems(bytes);
  const pages: string[] = [];
  for (const page of items) {
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const it of page) {
      if (!it.str.trim()) continue;
      const key = Math.round(it.y / 3);
      const row = rows.get(key) ?? [];
      row.push({ x: it.x, str: it.str });
      rows.set(key, row);
    }
    const lines = [...rows.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, row]) => row.sort((a, b) => a.x - b.x).map((r) => r.str.trim()).join(" "));
    pages.push(lines.join("\n"));
  }
  return pages.join("\n");
}

async function docxText(bytes: Uint8Array): Promise<string> {
  const mammoth = await import("mammoth");
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  return value;
}

export async function extractText(bytes: Uint8Array, kind: FileKind): Promise<string> {
  return kind === "pdf" ? pdfText(bytes) : docxText(bytes);
}
