import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { getHolidayCategoryLabel, type Holiday } from "@/lib/vn-holidays";
import {
  convertSolar2Lunar,
  MAX_SUPPORTED_LUNAR_YEAR,
  MIN_SUPPORTED_LUNAR_YEAR,
} from "@/lib/lunar-converter";
import { differenceInCalendarDays, format, isBefore, startOfToday } from "date-fns";
import { useNavigate } from "react-router-dom";
import { BookmarkPlus, Clock, Hourglass, ScrollText, Star, Trash2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";
import { useTemporalData } from "@/contexts/TemporalDataContext";
import { formatTemplate } from "@/i18n/dictionary";
import {
  findDuplicateSavedCountdownEvent,
  type SavedCountdownEvent,
} from "@/lib/saved-countdowns";
import {
  type SavedDayNote,
} from "@/lib/saved-day-notes";

interface DayDetailModalProps {
  selectedDay: Date | null;
  onClose: () => void;
  holidaysInYear: Holiday[];
  savedEventsForDay: SavedCountdownEvent[];
  savedDayNote: SavedDayNote | null;
  isFavoriteDay: boolean;
}

const getZodiacHours = (chiNgay: string, zodiacHoursMap: Record<string, string[]>): string =>
  (zodiacHoursMap[chiNgay] || []).join(", ");

export function DayDetailModal({ selectedDay, onClose, holidaysInYear, savedEventsForDay, savedDayNote, isFavoriteDay }: DayDetailModalProps) {
  const navigate = useNavigate();
  const { dictionary, dateLocale, locale } = useI18n();
  const {
    savedCountdowns,
    addSavedCountdown,
    deleteSavedCountdown,
    saveDayNote,
    clearDayNote,
    toggleFavoriteDay,
  } = useTemporalData();
  const [draftEventName, setDraftEventName] = useState("");
  const [feedback, setFeedback] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const [draftNote, setDraftNote] = useState("");
  const [noteFeedback, setNoteFeedback] = useState<{ message: string; variant: "success" | "info" } | null>(null);
  const todayStart = startOfToday();
  const selectedDayKey = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";
  const holidayInfo = selectedDay
    ? holidaysInYear
        .filter((holiday) => format(holiday.date, "yyyy-MM-dd") === selectedDayKey)
        .sort((left, right) => left.name.localeCompare(right.name, locale === "en" ? "en" : "vi"))
    : [];
  const suggestedEventName = holidayInfo[0]?.name ?? "";
  const getFeedbackMessage = (error: unknown, fallbackMessage: string) =>
    error instanceof Error && error.message.trim() ? error.message : fallbackMessage;

  useEffect(() => {
    setDraftEventName(suggestedEventName);
    setFeedback(null);
  }, [selectedDay?.getTime(), suggestedEventName]);
  useEffect(() => {
    setDraftNote(savedDayNote?.note ?? "");
    setNoteFeedback(null);
  }, [savedDayNote?.note, selectedDay?.getTime()]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setFeedback(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);
  useEffect(() => {
    if (!noteFeedback) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setNoteFeedback(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [noteFeedback]);

  if (!selectedDay) {
    return null;
  }

  const lunarInfo = convertSolar2Lunar(selectedDay.getDate(), selectedDay.getMonth() + 1, selectedDay.getFullYear());
  const countdownCopy = dictionary.tools.eventCountdown;
  const daysUntilSelectedDay = differenceInCalendarDays(selectedDay, todayStart);
  const countdownStatusLabel =
    daysUntilSelectedDay < 0
      ? countdownCopy.savedExpired
      : daysUntilSelectedDay === 0
        ? countdownCopy.savedToday
        : daysUntilSelectedDay === 1
          ? countdownCopy.savedTomorrow
          : formatTemplate(countdownCopy.savedDaysRemainingTemplate, { days: daysUntilSelectedDay });
  const canOpenCountdown = !isBefore(selectedDay, todayStart);

  const handleUseDate = () => {
    const dateString = format(selectedDay, "dd/MM/yyyy");
    navigate(`/tools/date-converter?date=${encodeURIComponent(dateString)}`);
  };

  const handleOpenCountdown = () => {
    const dateString = format(selectedDay, "dd/MM/yyyy");
    navigate(`/tools/event-countdown?date=${encodeURIComponent(dateString)}`);
  };

  const handleSaveCountdown = () => {
    const fallbackName = suggestedEventName || countdownCopy.unnamedEvent;

    if (findDuplicateSavedCountdownEvent(savedCountdowns, draftEventName, selectedDay, fallbackName)) {
      setFeedback({ message: countdownCopy.saveDuplicate, variant: "info" });
      return;
    }

    void addSavedCountdown(draftEventName, selectedDay, fallbackName)
      .then(() => {
        setDraftEventName(suggestedEventName);
        setFeedback({ message: countdownCopy.saveSuccess, variant: "success" });
      })
      .catch((error: unknown) => {
        setFeedback({
          message: getFeedbackMessage(error, countdownCopy.saveDuplicate),
          variant: "info",
        });
      });
  };

  const handleDeleteSavedEvent = (savedEventId: string) => {
    const deletedEvent = savedCountdowns.find((savedEvent) => savedEvent.id === savedEventId);

    void deleteSavedCountdown(savedEventId)
      .then(() => {
        setFeedback({
          message: formatTemplate(countdownCopy.deleteSavedTemplate, { name: deletedEvent?.name ?? countdownCopy.unnamedEvent }),
          variant: "info",
        });
      })
      .catch((error: unknown) => {
        setFeedback({
          message: getFeedbackMessage(error, countdownCopy.deleteSaved),
          variant: "info",
        });
      });
  };
  const handleSaveDayNote = () => {
    void saveDayNote(selectedDay, draftNote)
      .then(() => {
        setNoteFeedback({ message: dictionary.dayDetailNoteSaved, variant: "success" });
      })
      .catch((error: unknown) => {
        setNoteFeedback({
          message: getFeedbackMessage(error, dictionary.dayDetailNoteSaved),
          variant: "info",
        });
      });
  };

  const handleClearDayNote = () => {
    void clearDayNote(selectedDay)
      .then(() => {
        setDraftNote("");
        setNoteFeedback({ message: dictionary.dayDetailNoteCleared, variant: "info" });
      })
      .catch((error: unknown) => {
        setNoteFeedback({
          message: getFeedbackMessage(error, dictionary.dayDetailNoteCleared),
          variant: "info",
        });
      });
  };
  const handleToggleFavoriteDay = () => {
    void toggleFavoriteDay(selectedDay).catch(() => undefined);
  };

  return (
    <Dialog
      open={!!selectedDay}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent
        variant="sheet"
        className="border-primary/20 lg:w-full lg:max-w-[425px]"
        onEscapeKeyDown={onClose}
      >
        <div className="flex max-h-[88dvh] flex-col overflow-hidden">
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-primary/15 lg:hidden" />

          <div className="themed-scrollbar overflow-y-auto px-4 pb-4 pt-3 lg:px-0 lg:pb-0 lg:pt-0">
            <div className="flex items-start justify-between gap-3 pr-8">
              <DialogHeader className="min-w-0 flex-1 text-left">
                <DialogTitle className="text-2xl font-serif">{format(selectedDay, "dd/MM/yyyy")}</DialogTitle>
                <DialogDescription className="font-serif italic">
                  {format(selectedDay, "eeee", { locale: dateLocale })}
                </DialogDescription>
              </DialogHeader>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleToggleFavoriteDay}
                aria-label={isFavoriteDay ? dictionary.dayDetailUnfavorite : dictionary.dayDetailFavorite}
                title={isFavoriteDay ? dictionary.dayDetailUnfavorite : dictionary.dayDetailFavorite}
                className="mt-0.5 h-9 w-9 shrink-0 rounded-full border border-primary/10 bg-background/70 text-muted-foreground hover:bg-primary/5 hover:text-primary"
              >
                <Star className={isFavoriteDay ? "h-4 w-4 fill-primary/25 text-primary" : "h-4 w-4"} />
              </Button>
            </div>

            <div className="grid gap-4 py-4">
              {!lunarInfo ? (
                <div className="rounded-lg border border-primary/10 bg-muted/50 p-4 text-center">
                  <p className="font-serif text-lg font-bold text-foreground">{dictionary.dayDetailOutOfRangeTitle}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {dictionary.dayDetailOutOfRangeBody(MIN_SUPPORTED_LUNAR_YEAR, MAX_SUPPORTED_LUNAR_YEAR)}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-primary/10 bg-primary/5 p-4 text-center">
                  {(() => {
                    const [lunarDay, lunarMonth, , isLeap, dayCan, dayChi, monthCan, yearCan, yearChi] = lunarInfo;
                    return (
                      <>
                        <p className="mb-2 font-serif text-lg font-bold text-primary sm:text-xl">
                          {dictionary.dayDetailLunarDate(lunarDay, lunarMonth, isLeap)}
                        </p>
                        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-primary/10 pt-3 text-sm">
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{dictionary.dayDetailYear}</p>
                            <p className="font-serif font-medium">{yearCan} {yearChi}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{dictionary.dayDetailMonth}</p>
                            <p className="font-serif font-medium">
                              {monthCan} {dictionary.dayDetailMonthChiLabels[lunarMonth]}
                            </p>
                          </div>
                          <div>
                            <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">{dictionary.dayDetailDay}</p>
                            <p className="font-serif font-medium">{dayCan} {dayChi}</p>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {holidayInfo.length > 0 && (
                <div className="grid gap-2">
                  {holidayInfo.map((holiday) => (
                    <article
                      key={`${holiday.name}-${holiday.date.toISOString()}`}
                      className="rounded-xl border border-primary/12 bg-background/70 px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Star className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium leading-5 text-foreground">{holiday.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              {getHolidayCategoryLabel(holiday.category, locale)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <div className="rounded-xl border border-primary/10 bg-background/70 p-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <ScrollText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-serif text-sm font-semibold text-foreground">{dictionary.dayDetailNoteTitle}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{dictionary.dayDetailNoteDescription}</p>
                  </div>
                </div>

                <div className="mt-3 grid gap-2">
                  <Label htmlFor="day-detail-note" className="text-xs uppercase tracking-wider text-muted-foreground">
                    {dictionary.dayDetailNoteTitle}
                  </Label>
                  <Input
                    id="day-detail-note"
                    value={draftNote}
                    placeholder={dictionary.dayDetailNotePlaceholder}
                    maxLength={96}
                    onChange={(event) => setDraftNote(event.target.value)}
                  />
                </div>

                {noteFeedback && (
                  <div
                    className={
                      noteFeedback.variant === "success"
                        ? "mt-3 rounded-md bg-green-100/50 p-2 text-center font-serif text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
                        : "mt-3 rounded-md bg-primary/10 p-2 text-center font-serif text-sm text-primary"
                    }
                  >
                    {noteFeedback.message}
                  </div>
                )}

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Button onClick={handleSaveDayNote} disabled={draftNote.trim().length === 0} className="sm:w-auto">
                    {dictionary.dayDetailSaveNote}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClearDayNote}
                    disabled={!savedDayNote && draftNote.trim().length === 0}
                    className="sm:w-auto"
                  >
                    {dictionary.dayDetailClearNote}
                  </Button>
                </div>
              </div>

              {canOpenCountdown && (
                <div className="rounded-xl border border-primary/10 bg-primary/[0.04] p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <BookmarkPlus className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-sm font-semibold text-foreground">{dictionary.dayDetailMarkDateTitle}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{dictionary.dayDetailMarkDateDescription}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-2">
                    <Label htmlFor="day-detail-event-name" className="text-xs uppercase tracking-wider text-muted-foreground">
                      {countdownCopy.eventLabel}
                    </Label>
                    <Input
                      id="day-detail-event-name"
                      value={draftEventName}
                      placeholder={countdownCopy.eventPlaceholder}
                      onChange={(event) => setDraftEventName(event.target.value)}
                    />
                  </div>

                  {feedback && (
                    <div
                      className={
                        feedback.variant === "success"
                          ? "mt-3 rounded-md bg-green-100/50 p-2 text-center font-serif text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : "mt-3 rounded-md bg-primary/10 p-2 text-center font-serif text-sm text-primary"
                      }
                    >
                      {feedback.message}
                    </div>
                  )}

                  <Button onClick={handleSaveCountdown} className="mt-3 w-full sm:w-auto">
                    <BookmarkPlus className="h-4 w-4" />
                    {dictionary.dayDetailSaveCountdown}
                  </Button>
                </div>
              )}

              {savedEventsForDay.length > 0 && (
                <div className="grid gap-2">
                  <div className="flex items-center gap-2 px-1">
                    <Hourglass className="h-4 w-4 text-primary" />
                    <span className="font-serif text-sm font-semibold text-foreground">
                      {countdownCopy.savedSectionTitle}
                    </span>
                  </div>
                  {savedEventsForDay.map((savedEvent) => (
                    <article
                      key={savedEvent.id}
                      className="rounded-xl border border-primary/12 bg-background/70 px-3 py-2 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Hourglass className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-5 text-foreground">{savedEvent.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <span className="rounded-full border border-primary/15 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                              {countdownStatusLabel}
                            </span>
                          </div>
                        </div>
                        {canOpenCountdown && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteSavedEvent(savedEvent.id)}
                            aria-label={formatTemplate(countdownCopy.deleteSavedAriaTemplate, { name: savedEvent.name })}
                            title={countdownCopy.deleteSaved}
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {lunarInfo && (
                <div className="rounded-lg border border-primary/5 bg-accent/50 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="font-serif text-sm font-semibold">{dictionary.dayDetailLuckyHours}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {getZodiacHours(lunarInfo[5], dictionary.dayDetailZodiacHours)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t border-primary/10 bg-background/95 px-4 pb-4 pt-3 backdrop-blur-sm lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
            {canOpenCountdown && (
              <Button variant="outline" onClick={handleOpenCountdown} className="w-full lg:w-auto">
                {dictionary.dayDetailOpenCountdown}
              </Button>
            )}
            <Button onClick={handleUseDate} className="w-full bg-primary hover:bg-primary/90 lg:w-auto">
              {dictionary.dayDetailUseDate}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
