import { describe, expect, it } from "vitest";
import { parseResumeText } from "../parse-text";

const TEXT = `Taylor Morgan
Austin, TX | taylor.morgan@example.com | (512) 555-0188 | linkedin.com/in/taylormorgan

Summary
Customer-focused retail associate moving into operations.

Experience
Shift Lead | Bright Market | Austin, TX   Mar 2022 – Present
• Trained 6 new associates on register and inventory procedures
• Reduced end-of-day closing time by 20 minutes by reorganizing tasks
Sales Associate, Corner Books   Jun 2020 - Feb 2022
- Helped customers find books and processed returns

Education
Austin Community College | Associate of Applied Science, Business   2019 - 2021

Skills
Inventory management, Scheduling, Customer service, Excel

Certifications
ServSafe Food Handler, National Restaurant Association, 2023`;

describe("parseResumeText", () => {
  const { resume, warnings } = parseResumeText(TEXT);

  it("extracts contact details", () => {
    expect(resume.contact.fullName).toBe("Taylor Morgan");
    expect(resume.contact.email).toBe("taylor.morgan@example.com");
    expect(resume.contact.phone).toBe("(512) 555-0188");
    expect(resume.contact.location).toBe("Austin, TX");
    expect(resume.contact.links[0]).toContain("linkedin.com/in/taylormorgan");
  });

  it("extracts experience with dates and bullets", () => {
    expect(resume.experience).toHaveLength(2);
    const [lead, sales] = resume.experience;
    expect(lead.title).toBe("Shift Lead");
    expect(lead.organization).toBe("Bright Market");
    expect(lead.startDate).toBe("2022-03");
    expect(lead.current).toBe(true);
    expect(lead.bullets).toHaveLength(2);
    expect(sales.title).toBe("Sales Associate");
    expect(sales.organization).toBe("Corner Books");
    expect(sales.endDate).toBe("2022-02");
  });

  it("extracts education, skills and certifications", () => {
    expect(resume.education[0].school).toBe("Austin Community College");
    expect(resume.skills).toEqual(["Inventory management", "Scheduling", "Customer service", "Excel"]);
    expect(resume.certifications[0].name).toBe("ServSafe Food Handler");
    expect(resume.summary).toContain("retail associate");
  });

  it("leaves every fact unconfirmed and marked as uploaded", () => {
    expect(resume.contact.confirmed).toBe(false);
    expect(resume.contact.source).toBe("uploaded");
    for (const e of [...resume.experience, ...resume.education]) {
      expect(e.confirmed).toBe(false);
      expect(e.source).toBe("uploaded");
      expect(e.confidence).toBeDefined();
    }
    expect(resume.skillsConfirmed).toBe(false);
    expect(Array.isArray(warnings)).toBe(true);
  });

  it("does not invent content for empty input", () => {
    const r = parseResumeText("");
    expect(r.resume.experience).toEqual([]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

describe("year-only dates", () => {
  it("keeps a bare year as a year instead of inventing a month", () => {
    const { resume } = parseResumeText(TEXT);
    expect(resume.education[0].startDate).toBe("2019");
    expect(resume.education[0].endDate).toBe("2021");
    expect(resume.certifications[0].date).toBe("2023");
  });
});
