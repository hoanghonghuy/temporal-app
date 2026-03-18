import { useEffect, useState } from "react";
import { format, startOfToday } from "date-fns";
import { ToolCard } from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { getCountdownTargetDate } from "@/lib/date-logic";

interface EventCountdownProps {
  id: string;
}

export function EventCountdown({ id }: EventCountdownProps) {
  const { dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [eventName, setEventName] = useState<string>("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const copy = dictionary.tools.eventCountdown;
  const toolMeta = dictionary.toolMeta["event-countdown"];

  useEffect(() => {
    if (!isActive || !targetDate) {
      setCountdown("");
      return;
    }

    const countdownTarget = getCountdownTargetDate(targetDate);
    const intervalId = setInterval(() => {
      const now = Date.now();
      const distance = countdownTarget.getTime() - now;
      if (distance < 0) {
        clearInterval(intervalId);
        setCountdown(formatTemplate(copy.endedTemplate, { name: eventName || copy.unnamedEvent }));
        setIsActive(false);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(formatTemplate(copy.countdownTemplate, { days, hours, minutes, seconds }));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [copy, eventName, isActive, targetDate]);

  const handleStart = () => {
    if (!targetDate) return;

    if (targetDate < startOfToday()) {
      setError(copy.errorPastDate);
      setIsActive(false);
      setCountdown("");
      return;
    }

    setError("");
    setIsActive(true);
    setShowSuccess(true);
    window.setTimeout(() => setShowSuccess(false), 3000);

    addToHistory(
      copy.historyType,
      `${copy.historyEvent}: ${eventName || copy.unnamedEvent}\n${copy.historyTarget}: ${format(targetDate, "dd/MM/yyyy", { locale: dateLocale })}`
    );
  };

  const handleClear = () => {
    setIsActive(false);
    setTargetDate(undefined);
    setEventName("");
    setCountdown("");
    setError("");
  };

  return (
    <ToolCard id={id} title={toolMeta.title} description={toolMeta.description}>
      <div className="flex flex-col space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="event-name">{copy.eventLabel}</Label>
          <Input
            id="event-name"
            placeholder={copy.eventPlaceholder}
            value={eventName}
            onChange={(event) => setEventName(event.target.value)}
          />
        </div>
        <div className="grid w-full items-center gap-1.5">
          <Label className="font-serif">{copy.dateLabel}</Label>
          <DatePicker date={targetDate} setDate={setTargetDate} minDate={startOfToday()} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {showSuccess && (
          <div className="animate-in rounded-md bg-green-100/50 p-2 text-center font-serif text-sm text-green-600 fade-in duration-300 dark:bg-green-900/20 dark:text-green-400">
            {copy.success}
          </div>
        )}
        {countdown && (
          <div className="gold-glow mt-2 animate-in rounded-lg border border-primary/20 bg-primary/5 p-4 text-center text-sm fade-in duration-300">
            <p className="font-serif text-lg font-semibold tracking-wider text-primary">{countdown}</p>
          </div>
        )}
      </div>
      <CardFooter className="justify-between px-0 pt-6">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <Button onClick={handleStart} disabled={!targetDate || isActive}>
          {copy.start}
        </Button>
      </CardFooter>
    </ToolCard>
  );
}
