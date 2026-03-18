import { useState } from "react";
import { add, format, sub } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerWithToday } from "@/components/ui/date-picker-with-today";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";

interface DateCalculatorProps {
  id: string;
}

type DateUnit = "days" | "weeks" | "months" | "years";

export function DateCalculator({ id }: DateCalculatorProps) {
  const { localeTag, dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [baseDate, setBaseDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState<number>(1);
  const [unit, setUnit] = useState<DateUnit>("days");
  const [result, setResult] = useState<string>("");
  const copy = dictionary.tools.dateCalculator;
  const toolMeta = dictionary.toolMeta["date-calculator"];

  const handleCalculate = (operation: "add" | "subtract") => {
    if (!baseDate) return;

    const options = { [unit]: amount };
    const newDate = operation === "add" ? add(baseDate, options) : sub(baseDate, options);
    const formattedDate = newDate.toLocaleDateString(localeTag, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    setResult(formatTemplate(copy.resultTemplate, { formattedDate }));

    addToHistory(
      copy.historyType,
      `${copy.historyLabelBaseDate}: ${format(baseDate, "dd/MM/yyyy", { locale: dateLocale })}\n` +
        `${copy.historyLabelAction}: ${operation === "add" ? copy.actionAdd : copy.actionSubtract} ${amount} ${copy.units[unit]}\n` +
        `${copy.historyLabelResult}: ${format(newDate, "dd/MM/yyyy", { locale: dateLocale })}`
    );
  };

  const handleClear = () => {
    setBaseDate(new Date());
    setAmount(1);
    setUnit("days");
    setResult("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label className="font-serif italic text-primary/80">{copy.dateLabel}</Label>
          <DatePickerWithToday date={baseDate} setDate={setBaseDate} />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid flex-grow items-center gap-1.5">
            <Label htmlFor="amount" className="font-serif">
              {copy.amountLabel}
            </Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              min="1"
              onChange={(event) => setAmount(parseInt(event.target.value, 10) || 1)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5 sm:w-[140px]">
            <Label className="font-serif">{copy.unitLabel}</Label>
            <Select value={unit} onValueChange={(value) => setUnit(value as DateUnit)}>
              <SelectTrigger>
                <SelectValue placeholder={copy.unitPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days">{copy.units.days}</SelectItem>
                <SelectItem value="weeks">{copy.units.weeks}</SelectItem>
                <SelectItem value="months">{copy.units.months}</SelectItem>
                <SelectItem value="years">{copy.units.years}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {result && (
          <div className="gold-glow mt-2 animate-in rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm fade-in duration-300">
            <p className="text-center font-serif font-medium italic leading-relaxed text-foreground">{result}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <div className="flex space-x-2">
          <Button onClick={() => handleCalculate("add")}>{copy.add}</Button>
          <Button onClick={() => handleCalculate("subtract")}>{copy.subtract}</Button>
        </div>
      </CardFooter>
    </ToolCard>
  );
}
