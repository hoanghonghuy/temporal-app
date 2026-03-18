/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DATE_FNS_LOCALES,
  detectInitialLocale,
  DICTIONARIES,
  localeToTag,
  type AppLocale,
  type AppDictionary,
} from "@/i18n/dictionary";

interface I18nContextType {
  locale: AppLocale;
  setLocale: (nextLocale: AppLocale) => void;
  dictionary: AppDictionary;
  dateLocale: (typeof DATE_FNS_LOCALES)[AppLocale];
  localeTag: string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => detectInitialLocale());

  const setLocale = (nextLocale: AppLocale) => {
    setLocaleState(nextLocale);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("temporal-locale", nextLocale);
    }
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo<I18nContextType>(
    () => ({
      locale,
      setLocale,
      dictionary: DICTIONARIES[locale],
      dateLocale: DATE_FNS_LOCALES[locale],
      localeTag: localeToTag(locale),
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
