import { useEffect, useState } from "react";
import { format, isValid, parse } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_SOLAR_DATE,
  MAX_SUPPORTED_SOLAR_DATE,
} from "@/lib/lunar-converter";

interface DateConverterProps {
  id: string;
  initialDate?: string | null;
}

export function DateConverter({ id, initialDate }: DateConverterProps) {
  const { locale, dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [results, setResults] = useState<Record<string, string>>({});
  const [error, setError] = useState<string>("");
  const copy = dictionary.tools.dateConverter;
  const toolMeta = dictionary.toolMeta["date-converter"];

  const applyResults = (date: Date, saveHistory: boolean) => {
    const lunarInfo = convertSolar2Lunar(date.getDate(), date.getMonth() + 1, date.getFullYear(), locale);
    if (!lunarInfo) {
      setError(
        formatTemplate(copy.outOfRangeTemplate, {
          minYear: MIN_SUPPORTED_LUNAR_YEAR,
          maxYear: MAX_SUPPORTED_LUNAR_YEAR,
        })
      );
      setResults({});
      return;
    }

    const [lunarDay, lunarMonth, lunarYear, isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = lunarInfo;
    const nextResults = {
      [copy.labels.lunar]: formatTemplate(copy.lunarValueTemplate, {
        day: lunarDay,
        month: lunarMonth,
        year: lunarYear,
        leapSuffix: isLeap ? copy.lunarLeapSuffix : "",
      }),
      [copy.labels.canChi]: formatTemplate(copy.canChiValueTemplate, {
        yearCan,
        yearChi,
        monthCan,
        dayCan,
        dayChi,
      }),
      [copy.labels.iso]: format(date, "yyyy-MM-dd"),
      [copy.labels.localizedText]: format(date, copy.localizedDatePattern, { locale: dateLocale }),
    };

    setError("");
    setResults(nextResults);

    if (saveHistory) {
      const historyResult =
        `${copy.historySourceDate}: ${format(date, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        Object.entries(nextResults).map(([key, value]) => `${key}: ${value}`).join("\n");
      addToHistory(copy.historyType, historyResult);
    }
  };

  const handleConvert = (dateToConvert?: Date) => {
    const date = dateToConvert || selectedDate;
    if (!date || !isValid(date)) {
      setError("");
      setResults({});
      return;
    }

    applyResults(date, true);
  };

  useEffect(() => {
    if (initialDate) {
      const parsedDate = parse(initialDate, "dd/MM/yyyy", new Date());
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
        applyResults(parsedDate, false);
      } else {
        setSelectedDate(undefined);
        setResults({});
        setError("");
      }
    } else {
      setSelectedDate(undefined);
      setResults({});
      setError("");
    }
  }, [initialDate]);

  useEffect(() => {
    if (selectedDate) {
      applyResults(selectedDate, false);
    }
  }, [locale]);

  const handleClear = () => {
    setSelectedDate(undefined);
    setResults({});
    setError("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <DatePickerWithToday
          date={selectedDate}
          setDate={setSelectedDate}
          minDate={MIN_SUPPORTED_SOLAR_DATE}
          maxDate={MAX_SUPPORTED_SOLAR_DATE}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        {Object.keys(results).length > 0 && (
          <ul className="gold-glow mt-2 animate-in space-y-2 rounded-lg border border-primary/15 bg-primary/5 p-4 text-sm fade-in duration-300">
            {Object.entries(results).map(([key, value]) => (
              <li key={key} className="flex justify-between border-b border-primary/10 pb-2 last:border-b-0">
                <span className="font-serif italic text-muted-foreground">{key}:</span>
                <span className="text-right font-serif font-semibold text-primary">{value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={() => handleConvert()} disabled={!selectedDate}>
          {copy.convert}
        </Button>
      </CardFooter>
    </ToolCard>
  );
}
