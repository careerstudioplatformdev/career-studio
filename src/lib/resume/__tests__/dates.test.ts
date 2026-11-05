import { describe, expect, it } from "vitest";
import { formatRange, parseLooseDate, toMonthIndex } from "../dates";

describe("dates", () => {
  it("parses common resume date formats", () => {
    expect(parseLooseDate("Mar 2022")).toEqual({ value: "2022-03", precise: true });
    expect(parseLooseDate("September 2020").value).toBe("2020-09");
    expect(parseLooseDate("03/2021").value).toBe("2021-03");
    expect(parseLooseDate("2019")).toEqual({ value: "2019", precise: false });
    expect(parseLooseDate("someday").value).toBe("");
  });

  it("formats year-only dates without a month", () => {
    expect(formatRange("2019", "2021", false)).toBe("2019 – 2021");
    expect(formatRange("2022-03", "", true)).toBe("Mar 2022 – Present");
  });

  it("reads year-only end dates generously", () => {
    expect(toMonthIndex("2021", true)! - toMonthIndex("2021")!).toBe(11);
  });
});
