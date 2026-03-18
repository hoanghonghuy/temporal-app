import { describe, expect, it } from "vitest";
import { DICTIONARIES, localeToTag } from "../i18n/dictionary";
import { getHolidayCategoryLabel } from "./vn-holidays";
import { getToolDefinitions } from "./tool-registry";
import viLocale from "@/i18n/locales/vi.json";
import enLocale from "@/i18n/locales/en.json";
import viHolidayLocale from "@/i18n/locales/holidays.vi.json";
import enHolidayLocale from "@/i18n/locales/holidays.en.json";

describe("i18n dictionary", () => {
  it("maps locale tag correctly", () => {
    expect(localeToTag("vi")).toBe("vi-VN");
    expect(localeToTag("en")).toBe("en-US");
  });

  it("provides translated navigation labels", () => {
    expect(DICTIONARIES.vi.navCalendar).toBe(viLocale.navCalendar);
    expect(DICTIONARIES.en.navCalendar).toBe(enLocale.navCalendar);
  });

  it("translates holiday category labels by locale", () => {
    expect(getHolidayCategoryLabel("folk_festival", "vi")).toBe(viHolidayLocale.categoryLabels.folk_festival);
    expect(getHolidayCategoryLabel("folk_festival", "en")).toBe(enHolidayLocale.categoryLabels.folk_festival);
  });

  it("localizes tool metadata by locale", () => {
    const viTools = getToolDefinitions("vi");
    const enTools = getToolDefinitions("en");

    expect(viTools).toHaveLength(enTools.length);
    expect(viTools.find((tool) => tool.id === "date-converter")?.title).toBe(viLocale.toolMeta["date-converter"].title);
    expect(enTools.find((tool) => tool.id === "date-converter")?.title).toBe(enLocale.toolMeta["date-converter"].title);
  });
});
