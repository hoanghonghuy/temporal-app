import { LUNAR_INFO } from "./lunar-data";
import viLunarNames from "@/i18n/locales/lunar.vi.json";
import enLunarNames from "@/i18n/locales/lunar.en.json";

export type LunarLocale = "vi" | "en";

interface LunarNames {
  canNames: string[];
  chiNames: string[];
}

const LUNAR_NAMES_BY_LOCALE: Record<LunarLocale, LunarNames> = {
  vi: viLunarNames as LunarNames,
  en: enLunarNames as LunarNames,
};

export const MIN_SUPPORTED_LUNAR_YEAR = 1900;
export const MAX_SUPPORTED_LUNAR_YEAR = 2100;
export const MIN_SUPPORTED_SOLAR_DATE = new Date(1900, 0, 31);
export const MAX_SUPPORTED_SOLAR_DATE = new Date(2100, 11, 31);

export function isSupportedLunarYear(year: number) {
  return year >= MIN_SUPPORTED_LUNAR_YEAR && year <= MAX_SUPPORTED_LUNAR_YEAR;
}

export function getLunarMonthDays(year: number, month: number) {
  return (LUNAR_INFO[year - 1900] & (0x10000 >> month)) ? 30 : 29;
}

function getLeapMonth(year: number) {
  return LUNAR_INFO[year - 1900] & 0xf;
}

function getLeapMonthDays(year: number) {
  return getLeapMonth(year) ? ((LUNAR_INFO[year - 1900] & 0x10000) ? 30 : 29) : 0;
}

function getLunarYearDays(year: number) {
  let sum = 348;
  for (let mask = 0x8000; mask > 0x8; mask >>= 1) {
    sum += (LUNAR_INFO[year - 1900] & mask) ? 1 : 0;
  }
  return sum + getLeapMonthDays(year);
}

function jdn(dd: number, mm: number, yy: number) {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;

  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function getCanName(index: number, locale: LunarLocale) {
  const names = LUNAR_NAMES_BY_LOCALE[locale]?.canNames ?? LUNAR_NAMES_BY_LOCALE.vi.canNames;
  return names[((index % 10) + 10) % 10];
}

function getChiName(index: number, locale: LunarLocale) {
  const names = LUNAR_NAMES_BY_LOCALE[locale]?.chiNames ?? LUNAR_NAMES_BY_LOCALE.vi.chiNames;
  return names[((index % 12) + 12) % 12];
}

export type LunarDateInfo = [number, number, number, boolean, string, string, string, string, string];

export function convertSolar2Lunar(dd: number, mm: number, yy: number, locale: LunarLocale = "vi"): LunarDateInfo | null {
  if (!isSupportedLunarYear(yy)) return null;

  const date = new Date(Date.UTC(yy, mm - 1, dd));
  const date1900 = new Date(Date.UTC(1900, 0, 31));
  let offset = (date.getTime() - date1900.getTime()) / 86400000;

  let lunarYear = 1900;
  let daysInYear = 0;
  for (; lunarYear < 2101 && offset >= 0; lunarYear++) {
    daysInYear = getLunarYearDays(lunarYear);
    offset -= daysInYear;
  }

  if (offset < 0) {
    offset += daysInYear;
    lunarYear--;
  }

  if (!isSupportedLunarYear(lunarYear)) return null;

  const leapMonth = getLeapMonth(lunarYear);
  let isLeap = false;
  let lunarMonth = 1;

  for (; lunarMonth <= 12; lunarMonth++) {
    let daysInMonth;

    if (leapMonth > 0 && lunarMonth === leapMonth + 1 && !isLeap) {
      daysInMonth = getLeapMonthDays(lunarYear);
      if (offset < daysInMonth) {
        isLeap = true;
        break;
      }
      offset -= daysInMonth;
    }

    daysInMonth = getLunarMonthDays(lunarYear, lunarMonth);
    if (offset < daysInMonth) {
      isLeap = false;
      break;
    }
    offset -= daysInMonth;
  }

  const lunarDay = offset + 1;
  const jd = jdn(dd, mm, yy);
  const dayCan = getCanName(jd + 9, locale);
  const dayChi = getChiName(jd + 1, locale);
  const monthCan = getCanName(lunarYear * 12 + lunarMonth + 3, locale);
  const yearCan = getCanName(lunarYear + 6, locale);
  const yearChi = getChiName(lunarYear + 8, locale);

  return [lunarDay, lunarMonth, lunarYear, isLeap, dayCan, dayChi, monthCan, yearCan, yearChi];
}

export function convertLunar2Solar(ld: number, lm: number, ly: number, isLeap: boolean): Date | null {
  if (!isSupportedLunarYear(ly)) return null;

  const leapMonth = getLeapMonth(ly);
  if (isLeap && (!leapMonth || lm !== leapMonth)) return null;

  let offset = 0;

  for (let year = 1900; year < ly; year++) {
    offset += getLunarYearDays(year);
  }

  for (let month = 1; month < lm; month++) {
    offset += getLunarMonthDays(ly, month);
    if (leapMonth && month === leapMonth) {
      offset += getLeapMonthDays(ly);
    }
  }

  if (isLeap) {
    offset += getLunarMonthDays(ly, lm);
  }

  offset += ld - 1;

  const baseDate = new Date(Date.UTC(1900, 0, 31));
  const resultDateInUTC = new Date(baseDate.getTime() + offset * 86400000);

  return new Date(
    resultDateInUTC.getUTCFullYear(),
    resultDateInUTC.getUTCMonth(),
    resultDateInUTC.getUTCDate()
  );
}
