import { useState } from "react";
import { format } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { ToolResultDisplay } from "@/components/ui/tool-result-display";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";

interface AgeCalculatorProps {
  id: string;
}

export function AgeCalculator({ id }: AgeCalculatorProps) {
  const { dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [birthDate, setBirthDate] = useState<Date | undefined>();
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const copy = dictionary.tools.ageCalculator;
  const toolMeta = dictionary.toolMeta["age-calculator"];

  const handleCalculate = () => {
    setError("");
    setResult("");

    if (!birthDate) {
      setError(copy.errorRequired);
      return;
    }

    const today = new Date();
    if (birthDate > today) {
      setError(copy.errorFuture);
      return;
    }

    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
      months -= 1;
      const lastDayOfPreviousMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      days += lastDayOfPreviousMonth;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    setResult(formatTemplate(copy.resultTemplate, { years, months, days }));
    addToHistory(
      copy.historyType,
      formatTemplate(copy.historyResultTemplate, {
        date: format(birthDate, "dd/MM/yyyy"),
        years,
        months,
        days,
      })
    );
  };

  const handleClear = () => {
    setBirthDate(undefined);
    setResult("");
    setError("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label className="font-serif">{copy.birthDateLabel}</Label>
          <DatePicker date={birthDate} setDate={setBirthDate} placeholder={copy.birthDatePlaceholder} />
          <p className="font-serif text-xs text-muted-foreground">{copy.birthDateHint}</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && <ToolResultDisplay>{result}</ToolResultDisplay>}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleCalculate} disabled={!birthDate}>
          {copy.calculate}
        </Button>
      </CardFooter>
    </ToolCard>
  );
}
