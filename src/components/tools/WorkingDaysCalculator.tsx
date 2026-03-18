import { useEffect, useState } from "react";
import { eachDayOfInterval, format, isSaturday, isSunday } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { ToolResultDisplay } from "@/components/ui/tool-result-display";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { getVnHolidays } from "@/lib/vn-holidays";
import { MAX_SUPPORTED_SOLAR_DATE, MIN_SUPPORTED_SOLAR_DATE } from "@/lib/lunar-converter";

interface WorkingDaysCalculatorProps {
  id: string;
}

interface HolidayInRange {
  date: string;
  names: string[];
  checked: boolean;
}

export function WorkingDaysCalculator({ id }: WorkingDaysCalculatorProps) {
  const { dateLocale, dictionary, locale } = useI18n();
  const { addToHistory } = useHistory();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [holidaysInRange, setHolidaysInRange] = useState<HolidayInRange[]>([]);
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const copy = dictionary.tools.workingDaysCalculator;
  const toolMeta = dictionary.toolMeta["working-days-calculator"];

  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const allHolidays = [];
      for (let year = startYear; year <= endYear; year += 1) {
        allHolidays.push(...getVnHolidays(year, locale));
      }

      const holidaysByDate = new Map<string, HolidayInRange>();
      allHolidays
        .filter((holiday) => holiday.isDayOff)
        .filter((holiday) => holiday.date >= startDate && holiday.date <= endDate)
        .forEach((holiday) => {
          const dateKey = format(holiday.date, "yyyy-MM-dd");
          const existingHoliday = holidaysByDate.get(dateKey);
          if (existingHoliday) {
            if (!existingHoliday.names.includes(holiday.name)) {
              existingHoliday.names.push(holiday.name);
            }
            return;
          }

          holidaysByDate.set(dateKey, { date: dateKey, names: [holiday.name], checked: true });
        });

      setHolidaysInRange(Array.from(holidaysByDate.values()));
      return;
    }

    setHolidaysInRange([]);
  }, [startDate, endDate, locale]);

  const handleHolidayToggle = (date: string) => {
    setHolidaysInRange((previous) =>
      previous.map((holiday) => (holiday.date === date ? { ...holiday, checked: !holiday.checked } : holiday))
    );
  };

  const handleCalculate = () => {
    setError("");
    if (!startDate || !endDate) {
      setError(copy.errorRequired);
      return;
    }
    if (startDate > endDate) {
      setError(copy.errorInvalidRange);
      return;
    }

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const excludedHolidays = new Set(holidaysInRange.filter((holiday) => holiday.checked).map((holiday) => holiday.date));

    let workingDays = 0;
    for (const day of daysInterval) {
      const isWeekend = isSaturday(day) || isSunday(day);
      const isHoliday = excludedHolidays.has(format(day, "yyyy-MM-dd"));
      if (!isWeekend && !isHoliday) {
        workingDays += 1;
      }
    }

    setResult(formatTemplate(copy.resultTemplate, { workingDays }));
    addToHistory(
      copy.historyType,
      `${copy.historyFrom}: ${format(startDate, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        `${copy.historyTo}: ${format(endDate, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        `${copy.historyResultLabel}: ${formatTemplate(copy.historyResultTemplate, { workingDays })}`
    );
  };

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setResult("");
    setError("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label>{copy.startDate}</Label>
          <DatePickerWithToday
            date={startDate}
            setDate={setStartDate}
            minDate={MIN_SUPPORTED_SOLAR_DATE}
            maxDate={MAX_SUPPORTED_SOLAR_DATE}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label>{copy.endDate}</Label>
          <DatePickerWithToday
            date={endDate}
            setDate={setEndDate}
            minDate={MIN_SUPPORTED_SOLAR_DATE}
            maxDate={MAX_SUPPORTED_SOLAR_DATE}
          />
        </div>

        {holidaysInRange.length > 0 && (
          <div className="space-y-2 pt-2">
            <Label>{copy.holidaysLabel}</Label>
            <div className="themed-scrollbar max-h-32 space-y-2 overflow-y-auto rounded-md border p-2">
              {holidaysInRange.map((holiday) => (
                <div key={holiday.date} className="flex items-center space-x-2">
                  <Checkbox
                    id={holiday.date}
                    checked={holiday.checked}
                    onCheckedChange={() => handleHolidayToggle(holiday.date)}
                  />
                  <Label htmlFor={holiday.date} className="cursor-pointer text-sm font-normal">
                    {holiday.names.join(" / ")} ({format(new Date(holiday.date), "dd/MM", { locale: dateLocale })})
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && <ToolResultDisplay>{result}</ToolResultDisplay>}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleCalculate} disabled={!startDate || !endDate}>
          {copy.calculate}
        </Button>
      </CardFooter>
    </ToolCard>
  );
}
