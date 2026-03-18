import type { AppLocale } from "@/i18n/dictionary";
import viHexagrams from "@/i18n/locales/iching.vi.json";
import enHexagrams from "@/i18n/locales/iching.en.json";

export interface HexagramInfo {
  id: number;
  name: string;
  meaning: string;
}

const HEXAGRAMS_BY_LOCALE: Record<AppLocale, Record<string, HexagramInfo>> = {
  vi: viHexagrams as Record<string, HexagramInfo>,
  en: enHexagrams as Record<string, HexagramInfo>,
};

export const tossCoin = () => {
  return Math.random() < 0.5 ? 2 : 3;
};

export const getHexagramByLines = (binaryStr: string, locale: AppLocale = "vi") => {
  return HEXAGRAMS_BY_LOCALE[locale][binaryStr] || null;
};
