import { Suspense, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToolMaps, type ToolDefinition } from "@/lib/tool-registry";
import { StatusPanel } from "@/components/ui/status-panel";
import { useI18n } from "@/contexts/I18nContext";
import type { AppDictionary } from "@/i18n/dictionary";

type ToolsPageCopy = AppDictionary["toolsPage"];

function ToolFallback() {
  const { dictionary } = useI18n();
  return <StatusPanel variant="loading" message={dictionary.toolsFallback} />;
}

function useIsMobile(breakpoint = 768) {
  const query = `(max-width: ${breakpoint - 1}px)`;
  const getMatches = () => typeof window !== "undefined" && window.matchMedia(query).matches;
  const [isMobile, setIsMobile] = useState<boolean>(() => getMatches());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, [query]);

  return isMobile;
}

function buildToolHref(tool: ToolDefinition, dateFromUrl: string | null) {
  if (!dateFromUrl || !tool.supportsInitialDate) {
    return `/tools/${tool.slug}`;
  }

  return `/tools/${tool.slug}?date=${encodeURIComponent(dateFromUrl)}`;
}

function ToolRenderer({ tool, initialDate }: { tool: ToolDefinition; initialDate: string | null }) {
  const ToolComponent = tool.component;
  const key = tool.supportsInitialDate ? `${tool.slug}-${initialDate ?? "default"}` : tool.slug;

  return (
    <Suspense fallback={<ToolFallback />}>
      <ToolComponent id={tool.id} key={key} {...(tool.supportsInitialDate ? { initialDate } : {})} />
    </Suspense>
  );
}

function MobileToolsList({
  dateFromUrl,
  toolDefinitions,
  copy,
}: {
  dateFromUrl: string | null;
  toolDefinitions: ToolDefinition[];
  copy: ToolsPageCopy;
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="rounded-[28px] border border-primary/15 bg-card/95 p-4 shadow-sm sm:p-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-primary/80">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{copy.badge}</span>
        </div>
        <h1 className="mt-3 font-serif text-2xl text-foreground">{copy.chooseTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.chooseDescription}</p>
        {dateFromUrl ? (
          <div className="mt-3 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2 text-sm text-foreground">
            <span className="text-muted-foreground">{copy.selectedDateLabel}</span>{" "}
            <span className="font-medium">{dateFromUrl}</span>
          </div>
        ) : null}
      </section>

      <div className="grid gap-3">
        {toolDefinitions.map((tool) => (
          <Link
            key={tool.slug}
            to={buildToolHref(tool, dateFromUrl)}
            className="group flex items-center gap-3 rounded-[28px] border border-primary/12 bg-card/90 p-4 transition-all duration-200 hover:border-primary/25 hover:bg-card"
          >
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg text-foreground transition-colors group-hover:text-primary">{tool.title}</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{tool.description}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary/70 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SingleToolPage({
  tool,
  initialDate,
  copy,
}: {
  tool: ToolDefinition;
  initialDate: string | null;
  copy: ToolsPageCopy;
}) {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <section className="rounded-[28px] border border-primary/15 bg-card/95 p-4 shadow-sm sm:p-5">
        <Button asChild variant="ghost" className="-ml-3 mb-2 px-3 text-muted-foreground hover:text-foreground">
          <Link to="/tools">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {copy.allTools}
          </Link>
        </Button>
        <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{tool.title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{tool.description}</p>
        {initialDate && tool.supportsInitialDate ? (
          <div className="mt-3 inline-flex items-center rounded-full border border-primary/12 bg-primary/5 px-3 py-1 text-sm text-foreground">
            <span className="text-muted-foreground">{copy.selectedDateLabel}</span>
            <span className="ml-2 font-medium">{initialDate}</span>
          </div>
        ) : null}
      </section>

      <ToolRenderer tool={tool} initialDate={initialDate} />
    </div>
  );
}

function ToolsGrid({ dateFromUrl, toolDefinitions }: { dateFromUrl: string | null; toolDefinitions: ToolDefinition[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 scroll-mt-20 sm:gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
      {toolDefinitions.map((tool) => (
        <ToolRenderer
          key={tool.supportsInitialDate ? `${tool.slug}-${dateFromUrl ?? "default"}` : tool.slug}
          tool={tool}
          initialDate={tool.supportsInitialDate ? dateFromUrl : null}
        />
      ))}
    </div>
  );
}

export function ToolsPage() {
  const { locale, dictionary } = useI18n();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toolSlug } = useParams();
  const isMobile = useIsMobile();
  const dateFromUrl = searchParams.get("date");
  const copy = dictionary.toolsPage;
  const { definitions, bySlug, byId } = useMemo(() => getToolMaps(locale), [locale]);
  const selectedTool = toolSlug ? bySlug.get(toolSlug) : undefined;

  useEffect(() => {
    if (toolSlug || isMobile || !location.hash) {
      return undefined;
    }

    const id = location.hash.slice(1);
    let attempts = 0;
    let timeoutId: number | undefined;
    let cancelled = false;

    const scrollToTool = () => {
      if (cancelled) {
        return;
      }

      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (attempts < 10) {
        attempts += 1;
        timeoutId = window.setTimeout(scrollToTool, 120);
      }
    };

    scrollToTool();

    return () => {
      cancelled = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isMobile, location.hash, toolSlug]);

  if (toolSlug && !selectedTool) {
    return <Navigate to="/tools" replace />;
  }

  if (!toolSlug) {
    const hashTool = location.hash ? byId.get(location.hash.slice(1)) : undefined;

    if (isMobile && hashTool) {
      const query = searchParams.toString();
      const suffix = query ? `?${query}` : "";
      return <Navigate to={`/tools/${hashTool.slug}${suffix}`} replace />;
    }

    if (isMobile && dateFromUrl) {
      return <Navigate to={`/tools/date-converter?date=${encodeURIComponent(dateFromUrl)}`} replace />;
    }
  }

  if (selectedTool) {
    return <SingleToolPage tool={selectedTool} initialDate={dateFromUrl} copy={copy} />;
  }

  if (isMobile) {
    return <MobileToolsList dateFromUrl={dateFromUrl} toolDefinitions={definitions} copy={copy} />;
  }

  return <ToolsGrid dateFromUrl={dateFromUrl} toolDefinitions={definitions} />;
}
