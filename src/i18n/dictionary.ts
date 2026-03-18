import { enUS, vi } from "date-fns/locale";
import type { Locale } from "date-fns";
import viRaw from "@/i18n/locales/vi.json";
import enRaw from "@/i18n/locales/en.json";

export type AppLocale = "vi" | "en";
export type ToolId =
  | "date-converter"
  | "date-difference"
  | "date-calculator"
  | "age-calculator"
  | "event-countdown"
  | "working-days-calculator"
  | "leap-year"
  | "day-of-week-finder";

type RawDictionary = typeof viRaw;

export interface AppDictionary extends Omit<RawDictionary, "templates" | "dayDetailLunarLeapSuffix"> {
  historyConfirmBody: (count: number) => string;
  calendarMonthLabel: (month: number) => string;
  calendarLunarCrossYear: (startCan: string, startChi: string, endCan: string, endChi: string) => string;
  calendarLunarCrossMonth: (startMonth: number, endMonth: number, can: string, chi: string) => string;
  calendarLunarSingleMonth: (month: number, can: string, chi: string) => string;
  calendarDataNotice: (minYear: number, maxYear: number) => string;
  dayDetailOutOfRangeBody: (minYear: number, maxYear: number) => string;
  dayDetailLunarDate: (day: number, month: number, isLeap: boolean) => string;
}

export function formatTemplate(template: string, params: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ""));
}

function createDictionary(raw: RawDictionary): AppDictionary {
  const { templates, dayDetailLunarLeapSuffix, ...staticDictionary } = raw;

  return {
    ...staticDictionary,
    historyConfirmBody: (count: number) => formatTemplate(templates.historyConfirmBody, { count }),
    calendarMonthLabel: (month: number) => formatTemplate(templates.calendarMonthLabel, { month: month + 1 }),
    calendarLunarCrossYear: (startCan: string, startChi: string, endCan: string, endChi: string) =>
      formatTemplate(templates.calendarLunarCrossYear, { startCan, startChi, endCan, endChi }),
    calendarLunarCrossMonth: (startMonth: number, endMonth: number, can: string, chi: string) =>
      formatTemplate(templates.calendarLunarCrossMonth, { startMonth, endMonth, can, chi }),
    calendarLunarSingleMonth: (month: number, can: string, chi: string) =>
      formatTemplate(templates.calendarLunarSingleMonth, { month, can, chi }),
    calendarDataNotice: (minYear: number, maxYear: number) => formatTemplate(templates.calendarDataNotice, { minYear, maxYear }),
    dayDetailOutOfRangeBody: (minYear: number, maxYear: number) =>
      formatTemplate(templates.dayDetailOutOfRangeBody, { minYear, maxYear }),
    dayDetailLunarDate: (day: number, month: number, isLeap: boolean) =>
      formatTemplate(templates.dayDetailLunarDate, {
        day,
        month,
        leapSuffix: isLeap ? dayDetailLunarLeapSuffix : "",
      }),
  };
}

export const DICTIONARIES: Record<AppLocale, AppDictionary> = {
  vi: createDictionary(viRaw),
  en: createDictionary(enRaw),
};

export const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  vi,
  en: enUS,
};

export function detectInitialLocale(): AppLocale {
  if (typeof window === "undefined") {
    return "vi";
  }

  const saved = window.localStorage.getItem("temporal-locale");
  if (saved === "vi" || saved === "en") {
    return saved;
  }

  const language = window.navigator.language.toLowerCase();
  if (language.startsWith("en")) {
    return "en";
  }

  return "vi";
}

export function localeToTag(locale: AppLocale): string {
  return locale === "en" ? "en-US" : "vi-VN";
}
