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
});