import { describe, expect, it } from "vitest";
import { getDateDifferenceBreakdown, getCountdownTargetDate } from "./date-logic";
import { convertSolar2Lunar } from "./lunar-converter";
import { getVnHolidays } from "./vn-holidays";

describe("getDateDifferenceBreakdown", () => {
  it("handles leap-year month boundaries without negative days", () => {
    const result = getDateDifferenceBreakdown(new Date(2024, 0, 31), new Date(2024, 2, 1));

    expect(result).toEqual({
      years: 0,
      months: 1,
      days: 1,
      totalDays: 30,
    });
  });

  it("returns zero for the same date", () => {
    const sameDay = new Date(2026, 2, 16);

    expect(getDateDifferenceBreakdown(sameDay, sameDay)).toEqual({
      years: 0,
      months: 0,
      days: 0,
      totalDays: 0,
    });
  });
});

describe("getCountdownTargetDate", () => {
  it("normalizes to the end of the selected day", () => {
    const result = getCountdownTargetDate(new Date(2026, 2, 16, 9, 15, 0));

    expect(result.getHours()).toBe(23);
    expect(result.getMinutes()).toBe(59);
    expect(result.getSeconds()).toBe(59);
  });
});

describe("lunar guards", () => {
  it("rejects unsupported solar years", () => {
    expect(convertSolar2Lunar(1, 1, 2101)).toBeNull();
    expect(convertSolar2Lunar(1, 1, 2200)).toBeNull();
  });

  it("still converts supported boundary years", () => {
    expect(convertSolar2Lunar(31, 12, 2100)).not.toBeNull();
    expect(convertSolar2Lunar(31, 1, 1900)).not.toBeNull();
  });

  it("returns valid-year holidays even when lunar data is unavailable", () => {
    const holidays = getVnHolidays(2101);

    expect(holidays.length).toBeGreaterThan(0);
    expect(holidays.every((holiday) => holiday.date.getFullYear() === 2101)).toBe(true);
  });

  it("keeps multiple holidays that fall on the same solar day", () => {
    const holidays = getVnHolidays(2024).filter(
      (holiday) => holiday.date.getFullYear() === 2024 && holiday.date.getMonth() === 1 && holiday.date.getDate() === 14
    );

    expect(holidays.map((holiday) => holiday.name)).toEqual(
      expect.arrayContaining(["Valentine (Lễ tình nhân)", "Mùng 5 Tết"])
    );
    expect(holidays).toHaveLength(2);
  });

  it("maps can chi correctly for Tet 2026", () => {
    const lunar = convertSolar2Lunar(17, 2, 2026);

    expect(lunar).toEqual([
      1,
      1,
      2026,
      false,
      "Nh\u00e2m",
      "Tu\u1ea5t",
      "Canh",
      "B\u00ednh",
      "Ng\u1ecd",
    ]);
  });

  it("maps can chi correctly for Tet 2024", () => {
    const lunar = convertSolar2Lunar(10, 2, 2024);

    expect(lunar).toEqual([
      1,
      1,
      2024,
      false,
      "Gi\u00e1p",
      "Th\u00ecn",
      "B\u00ednh",
      "Gi\u00e1p",
      "Th\u00ecn",
    ]);
  });
});
