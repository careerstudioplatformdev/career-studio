import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { docxBuffer } from "../export-docx";
import { buildPdf, toWinAnsi } from "../export-pdf";
import { isExportReady, pendingConfirmations } from "../facts";
import { buildLayout, fileBaseName } from "../layout";
import { sampleResume } from "./fixtures";

describe("export gating", () => {
  it("is ready only when every fact is confirmed", () => {
    const r = sampleResume();
    expect(isExportReady(r)).toBe(true);
    r.experience[0].confirmed = false;
    expect(isExportReady(r)).toBe(false);
    expect(pendingConfirmations(r)[0].label).toBe("Data Intern");
  });
});

describe("layout", () => {
  it("orders sections and builds a contact line", () => {
    const l = buildLayout(sampleResume());
    expect(l.name).toBe("Jordan Lee");
    expect(l.contactLine).toContain("jordan@example.com");
    expect(l.sections.map((s) => s.title)).toEqual(["Experience", "Education", "Skills"]);
    expect(fileBaseName(sampleResume())).toBe("Jordan_Lee_Resume");
  });
});

describe("file export", () => {
  it("produces a valid DOCX (zip) file", async () => {
    const buf = await docxBuffer(buildLayout(sampleResume()));
    expect(buf[0]).toBe(0x50); // "PK"
    expect(buf[1]).toBe(0x4b);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("produces a valid PDF that reloads", async () => {
    const bytes = await buildPdf(buildLayout(sampleResume()));
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    const reloaded = await PDFDocument.load(bytes);
    expect(reloaded.getPageCount()).toBe(1);
  });

  it("strips characters standard PDF fonts can't draw", () => {
    expect(toWinAnsi("“Led” – team 🚀")).toBe('"Led" - team ');
  });
});
