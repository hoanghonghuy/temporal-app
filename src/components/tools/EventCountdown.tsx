import { useEffect, useMemo, useState } from "react";
import { differenceInCalendarDays, format, isBefore, isValid, parse, startOfToday } from "date-fns";
import { BookmarkPlus, CalendarDays, Play, Trash2 } from "lucide-react";
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
import {
  createSavedCountdownEvent,
  findDuplicateSavedCountdownEvent,
  fromDateKey,
  loadSavedCountdownEvents,
  persistSavedCountdownEvents,
  sortSavedCountdownEvents,
  subscribeToSavedCountdownEvents,
  type SavedCountdownEvent,
} from "@/lib/saved-countdowns";

interface EventCountdownProps {
  id: string;
  initialDate?: string | null;
}

interface FeedbackState {
  message: string;
  variant: "success" | "info";
}

export function EventCountdown({ id, initialDate }: EventCountdownProps) {
  const { dateLocale, dictionary } = useI18n();
  const { addToHistory } = useHistory();
  const [eventName, setEventName] = useState<string>("");
  const [targetDate, setTargetDate] = useState<Date | undefined>();
  const [countdown, setCountdown] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [savedEvents, setSavedEvents] = useState<SavedCountdownEvent[]>([]);
  const copy = dictionary.tools.eventCountdown;
  const toolMeta = dictionary.toolMeta["event-countdown"];
  const today = startOfToday();

  useEffect(() => {
    const loadEvents = () =>
      setSavedEvents(loadSavedCountdownEvents(typeof window === "undefined" ? undefined : window.localStorage));

    loadEvents();
    return subscribeToSavedCountdownEvents(loadEvents);
  }, []);

  useEffect(() => {
    if (!initialDate) {
      return;
    }

    const parsedDate = parse(initialDate, "dd/MM/yyyy", new Date());
    if (!isValid(parsedDate)) {
      return;
    }

    setTargetDate(parsedDate);
    setError("");
  }, [initialDate]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  useEffect(() => {
    if (!isActive || !targetDate) {
      setCountdown("");
      return;
    }

    const countdownTarget = getCountdownTargetDate(targetDate);
    let intervalId: number | undefined;
    const updateCountdown = () => {
      const now = Date.now();
      const distance = countdownTarget.getTime() - now;
      if (distance < 0) {
        if (intervalId !== undefined) {
          window.clearInterval(intervalId);
        }
        setCountdown(formatTemplate(copy.endedTemplate, { name: eventName || copy.unnamedEvent }));
        setIsActive(false);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setCountdown(formatTemplate(copy.countdownTemplate, { days, hours, minutes, seconds }));
    };

    updateCountdown();
    intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [copy, eventName, isActive, targetDate]);

  const savedEventRows = useMemo(
    () =>
      savedEvents
        .map((savedEvent) => {
          const savedDate = fromDateKey(savedEvent.dateKey);
          if (!savedDate) {
            return null;
          }

          const daysRemaining = differenceInCalendarDays(savedDate, today);
          const statusLabel =
            daysRemaining < 0
              ? copy.savedExpired
              : daysRemaining === 0
                ? copy.savedToday
                : daysRemaining === 1
                  ? copy.savedTomorrow
                  : formatTemplate(copy.savedDaysRemainingTemplate, { days: daysRemaining });

          return {
            ...savedEvent,
            savedDate,
            daysRemaining,
            formattedDate: format(savedDate, "dd/MM/yyyy", { locale: dateLocale }),
            statusLabel,
          };
        })
        .filter((savedEvent): savedEvent is NonNullable<typeof savedEvent> => savedEvent !== null),
    [copy, dateLocale, savedEvents, today]
  );

  const persistEvents = (nextEvents: SavedCountdownEvent[]) => {
    const sortedEvents = sortSavedCountdownEvents(nextEvents);
    setSavedEvents(sortedEvents);
    persistSavedCountdownEvents(sortedEvents, typeof window === "undefined" ? undefined : window.localStorage);
  };

  const startCountdown = (nextDate: Date, nextName: string) => {
    if (isBefore(nextDate, today)) {
      setError(copy.errorPastDate);
      setIsActive(false);
      setCountdown("");
      return false;
    }

    const normalizedName = nextName.trim();

    setEventName(normalizedName);
    setTargetDate(nextDate);
    setError("");
    setIsActive(true);
    setFeedback({ message: copy.success, variant: "success" });

    addToHistory(
      copy.historyType,
      `${copy.historyEvent}: ${normalizedName || copy.unnamedEvent}\n${copy.historyTarget}: ${format(nextDate, "dd/MM/yyyy", { locale: dateLocale })}`
    );

    return true;
  };

  const handleStart = () => {
    if (!targetDate) {
      return;
    }

    startCountdown(targetDate, eventName);
  };

  const handleSave = () => {
    if (!targetDate) {
      setError(copy.errorDateRequired);
      return;
    }

    if (isBefore(targetDate, today)) {
      setError(copy.errorPastDate);
      return;
    }

    if (findDuplicateSavedCountdownEvent(savedEvents, eventName, targetDate, copy.unnamedEvent)) {
      setError("");
      setFeedback({ message: copy.saveDuplicate, variant: "info" });
      return;
    }

    persistEvents([...savedEvents, createSavedCountdownEvent(eventName, targetDate, copy.unnamedEvent)]);
    setError("");
    setFeedback({ message: copy.saveSuccess, variant: "success" });
  };

  const handleLoadSavedEvent = (savedEvent: SavedCountdownEvent) => {
    const savedDate = fromDateKey(savedEvent.dateKey);
    if (!savedDate) {
      return;
    }

    setEventName(savedEvent.name);
    setTargetDate(savedDate);
    setError("");
    setFeedback({ message: formatTemplate(copy.loadedEventTemplate, { name: savedEvent.name }), variant: "info" });
  };

  const handleStartSavedEvent = (savedEvent: SavedCountdownEvent) => {
    const savedDate = fromDateKey(savedEvent.dateKey);
    if (!savedDate) {
      return;
    }

    startCountdown(savedDate, savedEvent.name);
  };

  const handleDeleteSavedEvent = (savedEventId: string) => {
    const deletedEvent = savedEvents.find((savedEvent) => savedEvent.id === savedEventId);
    persistEvents(savedEvents.filter((savedEvent) => savedEvent.id !== savedEventId));
    setFeedback({
      message: formatTemplate(copy.deleteSavedTemplate, { name: deletedEvent?.name ?? copy.unnamedEvent }),
      variant: "info",
    });
  };

  const handleClear = () => {
    setIsActive(false);
    setTargetDate(undefined);
    setEventName("");
    setCountdown("");
    setError("");
    setFeedback(null);
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
          <DatePicker date={targetDate} setDate={setTargetDate} minDate={today} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {feedback && (
          <div
            className={
              feedback.variant === "success"
                ? "animate-in rounded-md bg-green-100/50 p-2 text-center font-serif text-sm text-green-600 fade-in duration-300 dark:bg-green-900/20 dark:text-green-400"
                : "animate-in rounded-md bg-primary/10 p-2 text-center font-serif text-sm text-primary fade-in duration-300"
            }
          >
            {feedback.message}
          </div>
        )}
        {countdown && (
          <div className="gold-glow mt-2 animate-in rounded-lg border border-primary/20 bg-primary/5 p-4 text-center text-sm fade-in duration-300">
            <p className="font-serif text-lg font-semibold tracking-wider text-primary">{countdown}</p>
          </div>
        )}
        <div className="rounded-xl border border-primary/10 bg-primary/[0.03] p-4">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-4 w-4 text-primary" />
            <div>
              <p className="font-serif text-sm font-semibold text-foreground">{copy.savedSectionTitle}</p>
              <p className="text-xs leading-5 text-muted-foreground">{copy.savedSectionDescription}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {savedEventRows.length === 0 ? (
              <div className="rounded-lg border border-dashed border-primary/10 bg-background/70 p-3 text-sm text-muted-foreground">
                {copy.savedEmpty}
              </div>
            ) : (
              savedEventRows.map((savedEvent) => (
                <article
                  key={savedEvent.id}
                  className="rounded-xl border border-primary/10 bg-background/80 p-3 shadow-sm transition-colors hover:border-primary/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-serif text-base text-foreground">{savedEvent.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {savedEvent.formattedDate}
                        </span>
                        <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-primary/80">
                          {savedEvent.statusLabel}
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteSavedEvent(savedEvent.id)}
                      aria-label={formatTemplate(copy.deleteSavedAriaTemplate, { name: savedEvent.name })}
                      title={copy.deleteSaved}
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => handleLoadSavedEvent(savedEvent)}>
                      {copy.useSaved}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleStartSavedEvent(savedEvent)}
                      disabled={savedEvent.daysRemaining < 0}
                    >
                      <Play className="h-3.5 w-3.5" />
                      {copy.startSaved}
                    </Button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
      <CardFooter className="flex-col items-stretch gap-3 px-0 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" onClick={handleClear}>
          {copy.clear}
        </Button>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={handleSave} disabled={!targetDate}>
            <BookmarkPlus className="h-4 w-4" />
            {copy.save}
          </Button>
          <Button onClick={handleStart} disabled={!targetDate || isActive}>
            {copy.start}
          </Button>
        </div>
      </CardFooter>
    </ToolCard>
  );
}
