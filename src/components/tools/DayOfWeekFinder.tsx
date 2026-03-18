import { useState } from "react";
import { format } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";

interface DayOfWeekFinderProps {
  id: string;
}

export function DayOfWeekFinder({ id }: DayOfWeekFinderProps) {
  const { dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const copy = dictionary.tools.dayOfWeekFinder;
  const toolMeta = dictionary.toolMeta["day-of-week-finder"];

  const handleFindDay = () => {
    if (!selectedDate) return;

    const dayName = format(selectedDate, "eeee", { locale: dateLocale });
    setResult(formatTemplate(copy.resultTemplate, { dayName }));

    addToHistory(
      copy.historyType,
      `${copy.historyDate}: ${format(selectedDate, "dd/MM/yyyy", { locale: dateLocale })}\n${copy.historyResult}: ${dayName}`
    );
  };

  const handleClear = () => {
    setSelectedDate(undefined);
    setResult("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <DatePickerWithToday date={selectedDate} setDate={setSelectedDate} />
        {result && (
          <div className="gold-glow mt-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-center font-serif text-lg font-bold italic text-primary">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleFindDay} disabled={!selectedDate}>
          {copy.find}
        </Button>
      </CardFooter>
    </ToolCard>
  );
}
