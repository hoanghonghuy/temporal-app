import { format } from "date-fns";
import { convertLunar2Solar, getLunarMonthDays, isSupportedLunarYear } from "./lunar-converter";
import { formatTemplate, type AppLocale } from "@/i18n/dictionary";
import viHolidayData from "@/i18n/locales/holidays.vi.json";
import enHolidayData from "@/i18n/locales/holidays.en.json";

export type HolidayCategory = "public" | "traditional" | "folk_festival" | "observance";
type LabelLocale = AppLocale;

export interface Holiday {
  name: string;
  date: Date;
  category: HolidayCategory;
  isDayOff: boolean;
}

interface SolarHolidayDefinition {
  name: string;
  month: number;
  day: number;
  category: HolidayCategory;
  isDayOff: boolean;
}

interface LunarHolidayDefinition {
  name: string;
  lunarMonth: number;
  lunarDay: number;
  category: HolidayCategory;
  isDayOff: boolean;
}

interface HolidayLocaleData {
  solar: SolarHolidayDefinition[];
  lunar: LunarHolidayDefinition[];
  categoryLabels: Record<HolidayCategory, string>;
  tetEveName: string;
  tetDayTemplate: string;
}

const HOLIDAY_DATA_BY_LOCALE: Record<LabelLocale, HolidayLocaleData> = {
  vi: viHolidayData as HolidayLocaleData,
  en: enHolidayData as HolidayLocaleData,
};

function createHoliday(
  name: string,
  date: Date,
  category: HolidayCategory,
  isDayOff = false
): Holiday {
  return { name, date, category, isDayOff };
}

function pushHolidayIfValid(
  holidays: Holiday[],
  name: string,
  date: Date | null,
  category: HolidayCategory,
  isDayOff = false
) {
  if (date) {
    holidays.push(createHoliday(name, date, category, isDayOff));
  }
}

function getLocaleData(locale: LabelLocale) {
  return HOLIDAY_DATA_BY_LOCALE[locale] ?? HOLIDAY_DATA_BY_LOCALE.vi;
}

function getTetHolidays(lunarNewYear: number, locale: LabelLocale): Holiday[] {
  const tetHolidays: Holiday[] = [];
  if (!isSupportedLunarYear(lunarNewYear)) {
    return tetHolidays;
  }
  const localeData = getLocaleData(locale);

  const lunarOldYear = lunarNewYear - 1;
  const lastDayOfOldYear = isSupportedLunarYear(lunarOldYear) ? getLunarMonthDays(lunarOldYear, 12) : null;
  const giaoThua = lastDayOfOldYear ? convertLunar2Solar(lastDayOfOldYear, 12, lunarOldYear, false) : null;

  pushHolidayIfValid(tetHolidays, localeData.tetEveName, giaoThua, "traditional");

  const mung1Tet = convertLunar2Solar(1, 1, lunarNewYear, false);
  if (!mung1Tet) {
    return tetHolidays;
  }

  for (let day = 1; day <= 5; day += 1) {
    const tetDate = new Date(mung1Tet.getTime() + (day - 1) * 86400000);
    tetHolidays.push(
      createHoliday(formatTemplate(localeData.tetDayTemplate, { day }), tetDate, "traditional", true)
    );
  }

  return tetHolidays;
}

function getSolarHolidays(solarYear: number, locale: LabelLocale): Holiday[] {
  return getLocaleData(locale).solar.map((holiday) =>
    createHoliday(
      holiday.name,
      new Date(solarYear, holiday.month - 1, holiday.day),
      holiday.category,
      holiday.isDayOff
    )
  );
}

function getLunarHolidays(solarYear: number, locale: LabelLocale): Holiday[] {
  const holidays: Holiday[] = [];
  const candidateLunarYears = [solarYear - 1, solarYear, solarYear + 1];
  const localeData = getLocaleData(locale);

  for (const lunarYear of candidateLunarYears) {
    if (!isSupportedLunarYear(lunarYear)) {
      continue;
    }

    holidays.push(...getTetHolidays(lunarYear, locale));

    for (const holiday of localeData.lunar) {
      const date = convertLunar2Solar(holiday.lunarDay, holiday.lunarMonth, lunarYear, false);
      pushHolidayIfValid(holidays, holiday.name, date, holiday.category, holiday.isDayOff);
    }
  }

  return holidays.filter((holiday) => holiday.date.getFullYear() === solarYear);
}

export function getHolidayCategoryLabel(category: HolidayCategory, locale: LabelLocale = "vi"): string {
  return getLocaleData(locale).categoryLabels[category];
}

export function getVnHolidays(solarYear: number, locale: LabelLocale = "vi"): Holiday[] {
  const holidays = [...getSolarHolidays(solarYear, locale)];

  if (!isSupportedLunarYear(solarYear)) {
    return dedupeHolidays(holidays);
  }

  holidays.push(...getLunarHolidays(solarYear, locale));
  return dedupeHolidays(holidays);
}

function dedupeHolidays(holidays: Holiday[]) {
  const uniqueHolidays = new Map<string, Holiday>();

  holidays
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .forEach((holiday) => {
      const key = `${format(holiday.date, "yyyy-MM-dd")}::${holiday.name}`;
      if (!uniqueHolidays.has(key)) {
        uniqueHolidays.set(key, holiday);
      }
    });

  return Array.from(uniqueHolidays.values());
}
