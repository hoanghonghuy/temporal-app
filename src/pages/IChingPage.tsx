import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/contexts/HistoryContext";
import { useI18n } from "@/contexts/I18nContext";
import { formatTemplate } from "@/i18n/dictionary";
import { getHexagramByLines, tossCoin } from "@/lib/iching-data";
import { cn } from "@/lib/utils";

function HexagramLine({ value, isTransformed = false, label }: { value: number; isTransformed?: boolean; label?: string }) {
  const isYang = isTransformed ? value === 1 : value === 7 || value === 9;
  const isChanging = !isTransformed && (value === 6 || value === 9);

  return (
    <div className="grid w-full grid-cols-[1rem_minmax(0,1fr)_2.5rem] items-center gap-2 py-1.5 sm:grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] sm:gap-4 sm:py-2 lg:grid-cols-[2rem_minmax(0,1fr)_4rem] lg:gap-6">
      <div className="flex items-center justify-center text-xs font-bold text-primary sm:text-base lg:text-lg">
        {isChanging && <span className="animate-pulse">{value === 9 ? "○" : "×"}</span>}
      </div>

      <div className="flex h-7 items-center justify-center sm:h-10">
        {isYang ? (
          <div
            className={cn(
              "h-1.5 w-full max-w-[9rem] rounded-full bg-foreground/70 transition-all duration-700 sm:max-w-40 lg:max-w-48",
              isChanging && "h-2 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
            )}
          />
        ) : (
          <div className="flex h-1.5 w-full max-w-[9rem] justify-between sm:max-w-40 lg:max-w-48">
            <div
              className={cn(
                "h-full w-[43%] rounded-full bg-foreground/70 transition-all duration-700",
                isChanging && "h-2 bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
              )}
            />
            <div
              className={cn(
                "h-full w-[43%] rounded-full bg-foreground/70 transition-all duration-700",
                isChanging && "h-2 bg-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
              )}
            />
          </div>
        )}
      </div>

      <div className="flex justify-center text-center">
        {label && (
          <span className="whitespace-nowrap font-serif text-[9px] uppercase tracking-[0.16em] text-muted-foreground/40 sm:text-[10px] sm:tracking-[0.28em] lg:tracking-[0.4em]">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export function IChingPage() {
  const { dictionary, locale } = useI18n();
  const { addToHistory } = useHistory();
  const [lines, setLines] = useState<number[]>([]);
  const [isCasting, setIsCasting] = useState(false);
  const copy = dictionary.iching;

  const handleToss = () => {
    if (lines.length >= 6) return;
    setIsCasting(true);

    setTimeout(() => {
      const sum = tossCoin() + tossCoin() + tossCoin();
      const newLines = [...lines, sum];
      setLines(newLines);
      setIsCasting(false);

      if (newLines.length === 6) {
        const primaryBinary = newLines.map((line) => (line === 7 || line === 9 ? 1 : 0)).join("");
        const transformedBinary = newLines
          .map((line) => {
            if (line === 9) return 0;
            if (line === 6) return 1;
            return line === 7 ? 1 : 0;
          })
          .join("");
        const primary = getHexagramByLines(primaryBinary, locale);
        const transformed = getHexagramByLines(transformedBinary, locale);
        const hasChangingLines = newLines.some((line) => line === 6 || line === 9);
        const transformedName = hasChangingLines ? transformed?.name ?? copy.unchanged : copy.unchanged;

        addToHistory(copy.historyTitle, `${copy.historyResultLabel}: ${primary?.name} -> ${transformedName}`);
      }
    }, 600);
  };

  const handleReset = () => {
    setLines([]);
  };

  const primaryBinary = lines.length === 6 ? lines.map((line) => (line === 7 || line === 9 ? 1 : 0)).join("") : "";
  const transformedBinary =
    lines.length === 6
      ? lines.map((line) => (line === 9 ? 0 : line === 6 ? 1 : line === 7 ? 1 : 0)).join("")
      : "";
  const primaryHex = primaryBinary ? getHexagramByLines(primaryBinary, locale) : null;
  const transformedHex = transformedBinary ? getHexagramByLines(transformedBinary, locale) : null;
  const hasChangingLines = lines.some((line) => line === 6 || line === 9);

  const statusCopy =
    lines.length === 0
      ? copy.idleStatus
      : lines.length < 6
        ? formatTemplate(copy.linesProgressTemplate, { count: lines.length })
        : hasChangingLines
          ? copy.statusWithChangingLines
          : copy.statusWithoutChangingLines;

  return (
    <div className="relative mx-auto max-w-5xl animate-in px-0 py-4 fade-in duration-1000 sm:px-2 sm:py-8 lg:py-12">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary shadow-[inset_0_0_100px_hsl(var(--primary)/0.1)] sm:h-[520px] sm:w-[520px] lg:h-[900px] lg:w-[900px]" />
        <div className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/40 sm:h-[360px] sm:w-[360px] lg:h-[700px] lg:w-[700px]" />
        <div className="absolute left-1/2 top-1/2 h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 sm:h-[220px] sm:w-[220px] lg:h-[400px] lg:w-[400px]" />
      </div>

      <div className="mb-6 space-y-2 text-center sm:mb-12 sm:space-y-4 lg:mb-14">
        <h1 className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text font-serif text-2xl font-light uppercase tracking-[0.2em] text-transparent sm:text-4xl sm:tracking-[0.32em] lg:text-5xl lg:tracking-[0.4em]">
          {copy.title}
        </h1>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent sm:w-32" />
        <p className="mx-auto max-w-2xl px-2 font-serif text-[11px] leading-5 text-muted-foreground/75 sm:px-0 sm:text-sm sm:leading-6">
          {statusCopy}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6 sm:space-y-10 lg:space-y-14">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
          <span className="font-serif text-[9px] uppercase tracking-widest text-muted-foreground/30">{copy.progressLabel}</span>
          <div className="flex gap-2.5 sm:gap-4">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-700",
                  lines.length > index ? "scale-125 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]" : "border border-primary/10 bg-primary/5"
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[220px] w-full flex-col items-center justify-center sm:min-h-[300px] md:min-h-[340px] lg:min-h-[380px]">
          {lines.length === 6 && <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/[0.02] blur-[70px] sm:blur-[120px]" />}

          {lines.length === 0 ? (
            <button onClick={handleToss} disabled={isCasting} className="group relative flex flex-col items-center gap-4 sm:gap-8 lg:gap-10">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.02] transition-all duration-1000 group-hover:border-primary/30 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                <div className="absolute inset-3 rounded-full border border-dashed border-primary/10 transition-transform [transition-duration:4000ms] ease-linear group-hover:rotate-180 sm:inset-4" />
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 font-serif text-2xl text-primary/30 shadow-inner transition-all duration-1000 sm:h-20 sm:w-20 sm:text-4xl",
                    isCasting ? "scale-90 animate-spin opacity-100" : "opacity-60 group-hover:scale-110 group-hover:border-primary/60 group-hover:text-primary"
                  )}
                >
                  {"☯"}
                </div>
              </div>
              <span className="px-2 text-center text-[10px] font-light uppercase tracking-[0.28em] text-muted-foreground/60 transition-all group-hover:text-primary group-hover:tracking-[0.35em] sm:tracking-[0.5em] sm:group-hover:tracking-[0.65em]">
                {copy.startCasting}
              </span>
            </button>
          ) : (
            <div
              className={cn(
                "flex w-full flex-col items-center gap-6 transition-all duration-1000 md:flex-row md:items-start md:justify-center md:gap-8 lg:gap-16",
                lines.length < 6 ? "opacity-90" : "opacity-100"
              )}
            >
              <div className="flex w-full max-w-sm flex-col-reverse items-center gap-3 sm:max-w-md sm:gap-4">
                <div className="flex w-full flex-col-reverse">
                  {lines.map((line, index) => (
                    <HexagramLine key={index} value={line} label={copy.lineLabels[index]} />
                  ))}
                </div>
                {lines.length === 6 && (
                  <div className="mt-2 animate-in text-center slide-in-from-bottom-2 duration-1000 sm:mt-6 lg:mt-8">
                    <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40 sm:tracking-[0.3em]">
                      {copy.primaryHex}
                    </span>
                    <h3 className="font-serif text-lg font-medium tracking-tight text-primary sm:text-2xl">{primaryHex?.name}</h3>
                  </div>
                )}
              </div>

              {lines.length === 6 && hasChangingLines && (
                <div className="flex w-full max-w-sm flex-col-reverse items-center gap-3 animate-in fade-in slide-in-from-left-8 [animation-duration:1200ms] sm:max-w-md sm:gap-4">
                  <div className="flex w-full flex-col-reverse">
                    {transformedBinary
                      .split("")
                      .reverse()
                      .map((char, index) => (
                        <HexagramLine key={index} value={parseInt(char, 10)} isTransformed />
                      ))}
                  </div>
                  <div className="mt-2 text-center sm:mt-6 lg:mt-8">
                    <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40 sm:tracking-[0.3em]">
                      {copy.transformedHex}
                    </span>
                    <h3 className="font-serif text-lg font-medium tracking-tight text-primary sm:text-2xl">{transformedHex?.name}</h3>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-4 sm:gap-6">
          {lines.length > 0 && lines.length < 6 && (
            <Button
              onClick={handleToss}
              disabled={isCasting}
              variant="ghost"
              className="h-11 w-full max-w-xs px-6 font-serif text-[10px] uppercase tracking-[0.2em] text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary sm:h-14 sm:w-auto sm:max-w-none sm:px-10 sm:text-xs sm:tracking-[0.3em]"
            >
              {isCasting ? copy.casting : copy.continueCasting}
            </Button>
          )}

          {lines.length === 6 && (
            <div className="w-full max-w-2xl animate-in space-y-6 fade-in slide-in-from-bottom-4 duration-1000 sm:space-y-10">
              <div className="relative overflow-hidden rounded-2xl border border-primary/5 bg-primary/5 p-4 text-center sm:p-6 lg:p-8">
                <Sparkles className="absolute -left-2 -top-2 h-10 w-10 text-primary/10 sm:h-12 sm:w-12" />
                <div className="mx-auto max-w-lg space-y-4">
                  <p className="font-serif text-sm italic leading-relaxed text-foreground/80 sm:text-base">"{primaryHex?.meaning}"</p>
                  {hasChangingLines && (
                    <p className="border-t border-primary/5 pt-4 font-serif text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 sm:tracking-widest">
                      {copy.transformedLead} <strong>{transformedHex?.name}</strong>: {transformedHex?.meaning}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mx-auto flex items-center gap-2 font-serif text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary sm:tracking-[0.2em]"
              >
                <RotateCcw className="h-3 w-3" /> {copy.reset}
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-primary/10 bg-card/80 shadow-sm backdrop-blur-sm">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works" className="border-b border-primary/10 px-4 sm:px-6">
              <AccordionTrigger className="py-4 text-left font-serif text-sm text-foreground hover:no-underline sm:text-base">
                {copy.guideTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                <p>{copy.guideBody1}</p>
                <p className="mt-3">{copy.guideBody2}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="line-types" className="border-b border-primary/10 px-4 sm:px-6">
              <AccordionTrigger className="py-4 text-left font-serif text-sm text-foreground hover:no-underline sm:text-base">
                {copy.lineTypesTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {copy.lineTypeGuides.map((item) => (
                    <div key={item.code} className="rounded-xl border border-primary/10 bg-primary/5 p-3">
                      <p className="font-serif text-sm font-medium text-primary">
                        {item.code} . {item.name}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="read-result" className="px-4 sm:px-6">
              <AccordionTrigger className="py-4 text-left font-serif text-sm text-foreground hover:no-underline sm:text-base">
                {copy.readTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                <p>{copy.readBody1}</p>
                <p className="mt-3">{copy.readBody2}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
