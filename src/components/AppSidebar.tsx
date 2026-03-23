import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  CloudOff,
  History,
  Hourglass,
  Scroll,
  Star,
  UserRound,
  Wrench,
} from "lucide-react";
import { differenceInCalendarDays, format, startOfToday } from "date-fns";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { getToolDefinitions } from "@/lib/tool-registry";
import { cn } from "@/lib/utils";
import {
  fromDateKey,
  loadSavedCountdownEvents,
  subscribeToSavedCountdownEvents,
  type SavedCountdownEvent,
} from "@/lib/saved-countdowns";
import {
  loadSavedDayNotes,
  subscribeToSavedDayNotes,
  type SavedDayNote,
} from "@/lib/saved-day-notes";
import {
  loadSavedFavoriteDays,
  subscribeToSavedFavoriteDays,
  type SavedFavoriteDay,
} from "@/lib/saved-favorite-days";
import { MAX_SUPPORTED_LUNAR_YEAR, MIN_SUPPORTED_LUNAR_YEAR } from "@/lib/lunar-converter";

interface AppSidebarProps {
  onHistoryToggle: () => void;
  onNavigate?: () => void;
  className?: string;
}

const MIN_CALENDAR_MONTH = new Date(MIN_SUPPORTED_LUNAR_YEAR, 0, 1);
const MAX_CALENDAR_DAY = new Date(MAX_SUPPORTED_LUNAR_YEAR, 11, 31);

function SidebarSection({
  title,
  count,
  children,
  className,
}: {
  title: string;
  count?: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{title}</p>
        {typeof count === "number" && (
          <span className="rounded-full border border-primary/10 bg-primary/5 px-2 py-0.5 text-[10px] font-semibold text-primary">
            {count}
          </span>
        )}
      </div>
      <div className="rounded-xl border border-primary/10 bg-card/80 p-2 shadow-sm">{children}</div>
    </section>
  );
}

export function AppSidebar({ onHistoryToggle, onNavigate, className }: AppSidebarProps) {
  const location = useLocation();
  const { dictionary, dateLocale, locale } = useI18n();
  const [savedEvents, setSavedEvents] = useState<SavedCountdownEvent[]>([]);
  const [savedDayNotes, setSavedDayNotes] = useState<SavedDayNote[]>([]);
  const [savedFavoriteDays, setSavedFavoriteDays] = useState<SavedFavoriteDay[]>([]);
  const [isToolsListOpen, setIsToolsListOpen] = useState(location.pathname.startsWith("/tools"));
  const [quickView, setQuickView] = useState<"favorites" | "upcoming">("favorites");
  const toolDefinitions = useMemo(() => getToolDefinitions(locale), [locale]);
  const todayStart = startOfToday();

  useEffect(() => {
    const loadEvents = () =>
      setSavedEvents(loadSavedCountdownEvents(typeof window === "undefined" ? undefined : window.localStorage));

    loadEvents();
    return subscribeToSavedCountdownEvents(loadEvents);
  }, []);
  useEffect(() => {
    const loadNotes = () =>
      setSavedDayNotes(loadSavedDayNotes(typeof window === "undefined" ? undefined : window.localStorage));

    loadNotes();
    return subscribeToSavedDayNotes(loadNotes);
  }, []);
  useEffect(() => {
    const loadFavoriteDays = () =>
      setSavedFavoriteDays(loadSavedFavoriteDays(typeof window === "undefined" ? undefined : window.localStorage));

    loadFavoriteDays();
    return subscribeToSavedFavoriteDays(loadFavoriteDays);
  }, []);
  useEffect(() => {
    if (location.pathname.startsWith("/tools")) {
      setIsToolsListOpen(true);
    }
  }, [location.pathname]);

  const savedDayNotesByDate = useMemo(
    () => new Map(savedDayNotes.map((savedDayNote) => [savedDayNote.dateKey, savedDayNote.note])),
    [savedDayNotes]
  );
  const favoriteQuickLinks = useMemo(
    () =>
      savedFavoriteDays
        .map((savedFavoriteDay) => {
          const favoriteDate = fromDateKey(savedFavoriteDay.dateKey);
          if (!favoriteDate || favoriteDate < MIN_CALENDAR_MONTH || favoriteDate > MAX_CALENDAR_DAY) {
            return null;
          }

          return {
            ...savedFavoriteDay,
            favoriteDate,
            formattedDate: format(favoriteDate, "dd/MM/yyyy", { locale: dateLocale }),
            weekdayLabel: format(favoriteDate, "eeee", { locale: dateLocale }),
            note: savedDayNotesByDate.get(savedFavoriteDay.dateKey) ?? "",
          };
        })
        .filter((savedFavoriteDay): savedFavoriteDay is NonNullable<typeof savedFavoriteDay> => savedFavoriteDay !== null)
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
        .slice(0, 6),
    [dateLocale, savedDayNotesByDate, savedFavoriteDays]
  );
  const upcomingSavedEvents = useMemo(
    () =>
      savedEvents
        .map((savedEvent) => {
          const savedDate = fromDateKey(savedEvent.dateKey);
          if (!savedDate || savedDate < MIN_CALENDAR_MONTH || savedDate > MAX_CALENDAR_DAY) {
            return null;
          }

          const daysRemaining = differenceInCalendarDays(savedDate, todayStart);
          if (daysRemaining < 0) {
            return null;
          }

          const statusLabel =
            daysRemaining === 0
              ? dictionary.tools.eventCountdown.savedToday
              : daysRemaining === 1
                ? dictionary.tools.eventCountdown.savedTomorrow
                : formatTemplate(dictionary.tools.eventCountdown.savedDaysRemainingTemplate, { days: daysRemaining });

          return {
            ...savedEvent,
            savedDate,
            formattedDate: format(savedDate, "dd/MM/yyyy", { locale: dateLocale }),
            statusLabel,
          };
        })
        .filter((savedEvent): savedEvent is NonNullable<typeof savedEvent> => savedEvent !== null)
        .slice(0, 4),
    [dateLocale, dictionary.tools.eventCountdown, savedEvents, todayStart]
  );

  const handleNavigate = () => {
    onNavigate?.();
  };

  const handleOpenHistory = () => {
    onHistoryToggle();
    onNavigate?.();
  };
  const activeQuickView =
    quickView === "favorites" && favoriteQuickLinks.length === 0 && upcomingSavedEvents.length > 0
      ? "upcoming"
      : quickView;

  const mainNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
      isActive
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
    );
  const toolNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "block rounded-md px-2.5 py-1.5 text-sm transition-colors",
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
    );

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4", className)}>
      <div className="themed-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.05] text-primary/80">
            <Scroll className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-serif text-base font-semibold text-foreground">Temporal</p>
            <p className="truncate text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{dictionary.appSubtitle}</p>
          </div>
        </div>

        <SidebarSection title={dictionary.sidebarNavigationTitle}>
          <nav aria-label={dictionary.menuAria} className="grid gap-1">
            <NavLink to="/" className={mainNavLinkClass} onClick={handleNavigate}>
              <CalendarDays className="h-4 w-4" />
              {dictionary.navCalendar}
            </NavLink>

            <div className="rounded-lg bg-background/60 p-1">
              <div className="flex items-center gap-1">
                <NavLink
                  to="/tools"
                  className={({ isActive }) => cn("flex-1", mainNavLinkClass({ isActive }))}
                  onClick={handleNavigate}
                >
                  <Wrench className="h-4 w-4" />
                  {dictionary.navTools}
                </NavLink>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsToolsListOpen((current) => !current)}
                  aria-label={dictionary.navTools}
                  className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isToolsListOpen && "rotate-180")} />
                </Button>
              </div>

              {isToolsListOpen && (
                <div className="mt-1 grid gap-1 border-t border-primary/10 pt-2">
                  {toolDefinitions.map((tool) => (
                    <NavLink
                      key={tool.slug}
                      to={`/tools/${tool.slug}`}
                      className={toolNavLinkClass}
                      onClick={handleNavigate}
                    >
                      {tool.title}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            <NavLink to="/iching" className={mainNavLinkClass} onClick={handleNavigate}>
              <Scroll className="h-4 w-4" />
              {dictionary.navIChing}
            </NavLink>
          </nav>
        </SidebarSection>

        <SidebarSection title={dictionary.sidebarQuickTitle}>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setQuickView("favorites")}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                activeQuickView === "favorites"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
              )}
            >
              <span className="truncate">{dictionary.dayDetailFavoriteTitle}</span>
              <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">{favoriteQuickLinks.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setQuickView("upcoming")}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                activeQuickView === "upcoming"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-primary/[0.04] hover:text-foreground"
              )}
            >
              <span className="truncate">{dictionary.calendarUpcomingTitle}</span>
              <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[10px]">{upcomingSavedEvents.length}</span>
            </button>
          </div>

          <div className="mt-2">
            {activeQuickView === "favorites" ? (
              favoriteQuickLinks.length === 0 ? (
                <p className="px-2 py-1 text-sm leading-6 text-muted-foreground">{dictionary.sidebarFavoritesEmpty}</p>
              ) : (
                <div className="grid gap-1">
                  {favoriteQuickLinks.map((favoriteDay) => (
                    <Link
                      key={favoriteDay.dateKey}
                      to={`/?date=${favoriteDay.dateKey}`}
                      onClick={handleNavigate}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-primary/[0.04]"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Star className="h-3.5 w-3.5 fill-primary/25" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-serif text-sm text-foreground">{favoriteDay.formattedDate}</p>
                          <span className="text-[11px] text-muted-foreground">{favoriteDay.weekdayLabel}</span>
                        </div>
                        <p className="truncate text-xs leading-5 text-muted-foreground">
                          {favoriteDay.note || dictionary.sidebarFavoriteFallback}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : upcomingSavedEvents.length === 0 ? (
              <p className="px-2 py-1 text-sm leading-6 text-muted-foreground">{dictionary.sidebarUpcomingEmpty}</p>
            ) : (
              <div className="grid gap-1">
                {upcomingSavedEvents.map((savedEvent) => (
                  <Link
                    key={savedEvent.id}
                    to={`/?date=${savedEvent.dateKey}`}
                    onClick={handleNavigate}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-primary/[0.04]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Hourglass className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-serif text-sm text-foreground">{savedEvent.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{savedEvent.formattedDate}</span>
                        <span className="truncate">{savedEvent.statusLabel}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </SidebarSection>
      </div>

      <section className="shrink-0 space-y-2">
        <p className="px-1 text-[10px] uppercase tracking-[0.24em] text-muted-foreground">{dictionary.sidebarSystemTitle}</p>
        <div className="rounded-xl border border-primary/15 bg-background/95 p-2.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.04] text-primary/80">
              <UserRound className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{dictionary.sidebarAccountLabel}</p>
              <p className="truncate font-serif text-sm text-foreground">{dictionary.sidebarAccountSignedOut}</p>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CloudOff className="h-3.5 w-3.5" />
                <span>{dictionary.sidebarSyncLocalOnly}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenHistory}
              aria-label={dictionary.sidebarOpenHistory}
              title={dictionary.sidebarOpenHistory}
              className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
