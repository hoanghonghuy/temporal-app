import { useRef, useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToolCard } from "@/components/ToolCard";
import { CardFooter } from "@/components/ui/card";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { getDateDifferenceBreakdown } from "@/lib/date-logic";

interface DateDifferenceCalculatorProps {
  id: string;
}

export function DateDifferenceCalculator({ id }: DateDifferenceCalculatorProps) {
  const { dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const errorRef = useRef<HTMLParagraphElement>(null);
  const copy = dictionary.tools.dateDifference;
  const toolMeta = dictionary.toolMeta["date-difference"];

  const handleCalculate = () => {
    setError("");
    setResult("");

    if (!startDate || !endDate) {
      setError(copy.errorRequired);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (startDate > endDate) {
      setError(copy.errorInvalidRange);
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }

    const { years, months, days, totalDays } = getDateDifferenceBreakdown(startDate, endDate);
    setResult(formatTemplate(copy.resultTemplate, { years, months, days, totalDays }));

    addToHistory(
      copy.historyType,
      `${copy.historyFrom}: ${format(startDate, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        `${copy.historyTo}: ${format(endDate, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        `${copy.historyResult}: ${formatTemplate(copy.historyResultTemplate, { years, months, days })}`
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
          <Label htmlFor="start-date">{copy.startDate}</Label>
          <DatePickerWithToday date={startDate} setDate={setStartDate} />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="end-date">{copy.endDate}</Label>
          <DatePickerWithToday date={endDate} setDate={setEndDate} />
        </div>
        {error && (
          <p ref={errorRef} className="font-serif text-sm text-destructive">
            {error}
          </p>
        )}
        {result && (
          <div className="gold-glow mt-2 animate-in rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm fade-in duration-300">
            <p className="text-center font-serif font-medium italic leading-relaxed text-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="flex justify-end space-x-2 px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleCalculate}>{copy.calculate}</Button>
      </CardFooter>
    </ToolCard>
  );
}
