import { describe, expect, it } from "vitest";
import { composeContribution, hasMetric, numbersIn, quantifyPrompts, unsupportedNumbers } from "../impact";

describe("composeContribution (XYZ bullets)", () => {
  it("builds action + scope + method + result + metric from the user's words only", () => {
    expect(
      composeContribution({ action: "automated the weekly sales report", scope: "for a 12-person sales team", how: "using Excel Power Query", result: "cutting prep time", metric: "3 hours a week" }),
    ).toBe("Automated the weekly sales report for a 12-person sales team using Excel Power Query, cutting prep time by 3 hours a week.");
  });

  it("leaves out missing parts instead of inventing them", () => {
    expect(composeContribution({ action: "Trained new cashiers", scope: "", how: "", result: "", metric: "" })).toBe("Trained new cashiers.");
    expect(composeContribution({ action: "Organized a food drive", scope: "", how: "", result: "", metric: "300 meals" })).toBe("Organized a food drive (300 meals).");
    expect(composeContribution({ action: "", scope: "x", how: "", result: "", metric: "5" })).toBe("");
  });
});

describe("metrics and grounding", () => {
  it("detects measurable results", () => {
    expect(hasMetric("Served 40 customers a day")).toBe(true);
    expect(hasMetric("Doubled weekly sign-ups")).toBe(true);
    expect(hasMetric("Helped customers")).toBe(false);
  });

  it("normalizes numbers", () => {
    expect(numbersIn("Raised $12,000 (40%) in 2.0 years")).toEqual(["12000", "40", "2"]);
  });

  it("flags numbers the user never stated", () => {
    expect(unsupportedNumbers("Cut costs by 35% for 12,000 customers", ["We had about 12000 customers"])).toEqual(["35"]);
    expect(unsupportedNumbers("Served 40 guests", ["I served 40 guests a night"])).toEqual([]);
  });

  it("offers relevant prompts to quantify a bullet", () => {
    const p = quantifyPrompts("Trained new staff on the register");
    expect(p.some((q) => /how many people/i.test(q))).toBe(true);
    expect(p.at(-1)).toMatch(/explain in an interview/);
  });
});
