import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { coachInput, interviewInput, resumeForPrompt, safeParse } from "../inputs";
import { APPROVER_SYSTEM, COACH_SYSTEM, TAILOR_SYSTEM, builderSystem } from "../prompts";
import * as schemas from "../schemas";
import { sampleResume } from "../../resume/__tests__/fixtures";

describe("AI output schemas", () => {
  it.each(Object.entries(schemas).filter(([k]) => k.endsWith("Schema")))("%s converts to a structured-output format", (_name, schema) => {
    const format = betaZodOutputFormat(schema as never) as unknown as { schema: { additionalProperties?: boolean } };
    expect(format.schema).toBeTruthy();
  });
});

describe("AI inputs and prompts", () => {
  it("validates and normalizes request bodies", () => {
    const parse = safeParse(coachInput);
    expect(parse({ resume: {}, story: "hi", chat: [] })?.resume.pageTarget).toBe(1);
    expect(parse({ resume: {}, story: "x".repeat(20000), chat: [] })).toBeNull();
    expect(safeParse(interviewInput)({ mode: "feedback", resume: {}, question: "Why?", answer: "short" })).toBeNull();
  });

  it("strips bookkeeping fields from the prompt resume", () => {
    const text = resumeForPrompt(sampleResume());
    expect(text).toContain("Acme Corp");
    expect(text).not.toContain('"confirmed"');
    expect(text).not.toContain('"source"');
  });

  it("puts the honesty rules in every generating prompt", () => {
    for (const p of [COACH_SYSTEM, TAILOR_SYSTEM, APPROVER_SYSTEM, builderSystem("A", 1)]) expect(p).toMatch(/Never invent/);
  });
});
