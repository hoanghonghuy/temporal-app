import { useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";

import { useHistory } from "@/contexts/HistoryContext";
import { getHexagramByLines, tossCoin } from "@/lib/iching-data";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const UI = {
  historyTitle: "Gieo Qu\u1ebb",
  historyResultLabel: "Qu\u1ebb",
  unchanged: "Kh\u00f4ng \u0111\u1ed5i",
  title: "Thi\u00ean C\u01a1",
  idleStatus:
    "B\u1ea5m 6 l\u1ea7n \u0111\u1ec3 t\u1ea1o qu\u1ebb. C\u00e1c h\u00e0o \u0111\u01b0\u1ee3c x\u1ebfp t\u1eeb d\u01b0\u1edbi l\u00ean tr\u00ean theo th\u1ee9 t\u1ef1 S\u01a1, Nh\u1ecb, Tam, T\u1ee9, Ng\u0169, Th\u01b0\u1ee3ng.",
  progressLabel: "Ti\u1ebfn \u0111\u1ed9",
  startCasting: "Kh\u1edfi T\u00e2m Gieo Qu\u1ebb",
  continueCasting: "Ti\u1ebfp t\u1ee5c gieo",
  casting: "\u0110ang \u0111\u1ecbnh h\u00e0o...",
  primaryHex: "B\u1ea3n Qu\u00e1i",
  transformedHex: "Bi\u1ebfn Qu\u00e1i",
  reset: "Gieo Qu\u1ebb Kh\u00e1c",
  transformedLead: "S\u1ef1 vi\u1ec7c bi\u1ebfn chuy\u1ec3n th\u00e0nh",
  guideTitle: "M\u1edbi d\u00f9ng l\u1ea7n \u0111\u1ea7u? \u0110\u00e2y l\u00e0 c\u00e1ch gieo qu\u1ebb ho\u1ea1t \u0111\u1ed9ng",
  guideBody1:
    "M\u1ed7i l\u1ea7n b\u1ea1n b\u1ea5m n\u00fat gieo, 3 \u0111\u1ed3ng ti\u1ec1n s\u1ebd \u0111\u01b0\u1ee3c m\u00f4 ph\u1ecfng \u0111\u1ec3 t\u1ea1o ra 1 h\u00e0o. Gieo \u0111\u1ee7 6 l\u1ea7n th\u00ec s\u1ebd c\u00f3 1 qu\u1ebb ho\u00e0n ch\u1ec9nh, c\u00e1c h\u00e0o \u0111\u01b0\u1ee3c x\u1ebfp t\u1eeb d\u01b0\u1edbi l\u00ean tr\u00ean theo th\u1ee9 t\u1ef1 S\u01a1, Nh\u1ecb, Tam, T\u1ee9, Ng\u0169, Th\u01b0\u1ee3ng.",
  guideBody2:
    "V\u00ec m\u1ed7i h\u00e0o ch\u1ec9 c\u00f3 th\u1ec3 l\u00e0 \u00e2m ho\u1eb7c d\u01b0\u01a1ng, t\u1ed5ng c\u1ed9ng s\u1ebd c\u00f3 64 t\u1ed5 h\u1ee3p qu\u1ebb. B\u1ea1n s\u1ebd th\u1ea5y t\u00ean qu\u1ebb v\u00e0 \u00fd ngh\u0129a ng\u1eafn g\u1ecdn \u0111\u1ec3 \u0111\u1ecdc nhanh.",
  lineTypesTitle: "4 lo\u1ea1i h\u00e0o 6, 7, 8, 9 ngh\u0129a l\u00e0 g\u00ec?",
  readTitle: "B\u1ea3n qu\u00e1i v\u00e0 bi\u1ebfn qu\u00e1i n\u00ean \u0111\u1ecdc nh\u01b0 th\u1ebf n\u00e0o?",
  readBody1:
    "B\u1ea3n qu\u00e1i l\u00e0 qu\u1ebb ch\u00ednh, ph\u1ea3n \u00e1nh tr\u1ea1ng th\u00e1i hi\u1ec7n t\u1ea1i ho\u1eb7c v\u1ea5n \u0111\u1ec1 b\u1ea1n \u0111ang h\u1ecfi. N\u1ebfu xu\u1ea5t hi\u1ec7n h\u00e0o \u0111\u1ed9ng (6 ho\u1eb7c 9), s\u1ebd c\u00f3 th\u00eam bi\u1ebfn qu\u00e1i \u0111\u1ec3 ch\u1ec9 ra xu h\u01b0\u1edbng thay \u0111\u1ed5i ti\u1ebfp theo.",
  readBody2:
    "N\u1ebfu kh\u00f4ng c\u00f3 h\u00e0o \u0111\u1ed9ng, b\u1ea1n ch\u1ec9 c\u1ea7n \u0111\u1ecdc b\u1ea3n qu\u00e1i. N\u1ebfu c\u00f3 bi\u1ebfn qu\u00e1i, h\u00e3y xem b\u1ea3n qu\u00e1i l\u00e0 \"hi\u1ec7n t\u1ea1i\" v\u00e0 bi\u1ebfn qu\u00e1i l\u00e0 \"\u0111i\u1ec3m \u0111\u1ebfn\" ho\u1eb7c \"chi\u1ec1u h\u01b0\u1edbng chuy\u1ec3n h\u00f3a\".",
};

const LINE_LABELS = ["S\u01a1", "Nh\u1ecb", "Tam", "T\u1ee9", "Ng\u0169", "Th\u01b0\u1ee3ng"];

const LINE_TYPE_GUIDES = [
  {
    code: "6",
    name: "\u00c2m \u0111\u1ed9ng",
    description: "H\u00e0o \u0111\u1ee9t v\u00e0 \u0111ang bi\u1ebfn. Khi lu\u1eadn sang bi\u1ebfn qu\u00e1i, h\u00e0o n\u00e0y \u0111\u1ed5i th\u00e0nh d\u01b0\u01a1ng.",
  },
  {
    code: "7",
    name: "D\u01b0\u01a1ng t\u0129nh",
    description: "H\u00e0o li\u1ec1n v\u00e0 \u1ed5n \u0111\u1ecbnh. H\u00e0o n\u00e0y gi\u1eef nguy\u00ean \u1edf b\u1ea3n qu\u00e1i l\u1eabn bi\u1ebfn qu\u00e1i.",
  },
  {
    code: "8",
    name: "\u00c2m t\u0129nh",
    description: "H\u00e0o \u0111\u1ee9t v\u00e0 \u1ed5n \u0111\u1ecbnh. H\u00e0o n\u00e0y gi\u1eef nguy\u00ean, kh\u00f4ng t\u1ea1o chuy\u1ec3n \u0111\u1ed9ng.",
  },
  {
    code: "9",
    name: "D\u01b0\u01a1ng \u0111\u1ed9ng",
    description: "H\u00e0o li\u1ec1n v\u00e0 \u0111ang bi\u1ebfn. Khi lu\u1eadn sang bi\u1ebfn qu\u00e1i, h\u00e0o n\u00e0y \u0111\u1ed5i th\u00e0nh \u00e2m.",
  },
];

function HexagramLine({ value, isTransformed = false, label }: { value: number; isTransformed?: boolean; label?: string }) {
  const isYang = isTransformed ? value === 1 : value === 7 || value === 9;
  const isChanging = !isTransformed && (value === 6 || value === 9);

  return (
    <div className="grid w-full grid-cols-[1rem_minmax(0,1fr)_2.5rem] items-center gap-2 py-1.5 sm:grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] sm:gap-4 sm:py-2 lg:grid-cols-[2rem_minmax(0,1fr)_4rem] lg:gap-6">
      <div className="flex items-center justify-center text-xs font-bold text-primary sm:text-base lg:text-lg">
        {isChanging && <span className="animate-pulse">{value === 9 ? "\u25cb" : "\u00d7"}</span>}
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
  const { addToHistory } = useHistory();
  const [lines, setLines] = useState<number[]>([]);
  const [isCasting, setIsCasting] = useState(false);

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

        const primary = getHexagramByLines(primaryBinary);
        const transformed = getHexagramByLines(transformedBinary);

        addToHistory(
          UI.historyTitle,
          `${UI.historyResultLabel}: ${primary?.name} -> ${transformed?.name || UI.unchanged}`
        );
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
  const primaryHex = primaryBinary ? getHexagramByLines(primaryBinary) : null;
  const transformedHex = transformedBinary ? getHexagramByLines(transformedBinary) : null;
  const hasChangingLines = lines.some((line) => line === 6 || line === 9);

  const statusCopy =
    lines.length === 0
      ? UI.idleStatus
      : lines.length < 6
        ? `\u0110\u00e3 c\u00f3 ${lines.length}/6 h\u00e0o. Ti\u1ebfp t\u1ee5c gieo \u0111\u1ec3 ho\u00e0n th\u00e0nh qu\u1ebb.`
        : hasChangingLines
          ? "B\u1ea3n qu\u00e1i th\u1ec3 hi\u1ec7n tr\u1ea1ng th\u00e1i hi\u1ec7n t\u1ea1i, c\u00f2n bi\u1ebfn qu\u00e1i cho th\u1ea5y h\u01b0\u1edbng chuy\u1ec3n h\u00f3a khi c\u00f3 h\u00e0o \u0111\u1ed9ng."
          : "Qu\u1ebb n\u00e0y kh\u00f4ng c\u00f3 h\u00e0o \u0111\u1ed9ng, v\u00ec v\u1eady b\u1ea1n ch\u1ec9 c\u1ea7n \u0111\u1ecdc b\u1ea3n qu\u00e1i \u0111\u1ec3 lu\u1eadn \u00fd ngh\u0129a ch\u00ednh.";

  return (
    <div className="relative mx-auto max-w-5xl animate-in fade-in px-0 py-4 duration-1000 sm:px-2 sm:py-8 lg:py-12">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary shadow-[inset_0_0_100px_hsl(var(--primary)/0.1)] sm:h-[520px] sm:w-[520px] lg:h-[900px] lg:w-[900px]" />
        <div className="absolute left-1/2 top-1/2 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/40 sm:h-[360px] sm:w-[360px] lg:h-[700px] lg:w-[700px]" />
        <div className="absolute left-1/2 top-1/2 h-[130px] w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 sm:h-[220px] sm:w-[220px] lg:h-[400px] lg:w-[400px]" />
      </div>

      <div className="mb-6 space-y-2 text-center sm:mb-12 sm:space-y-4 lg:mb-14">
        <h1 className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-2xl font-serif font-light uppercase tracking-[0.2em] text-transparent sm:text-4xl sm:tracking-[0.32em] lg:text-5xl lg:tracking-[0.4em]">
          {UI.title}
        </h1>
        <div className="mx-auto h-px w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent sm:w-32" />
        <p className="mx-auto max-w-2xl px-2 text-[11px] font-serif leading-5 text-muted-foreground/75 sm:px-0 sm:text-sm sm:leading-6">
          {statusCopy}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-6 sm:space-y-10 lg:space-y-14">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:gap-6">
          <span className="font-serif text-[9px] uppercase tracking-widest text-muted-foreground/30">{UI.progressLabel}</span>
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
          {lines.length === 6 && <div className="absolute inset-0 -z-10 rounded-full bg-primary/[0.02] blur-[70px] animate-pulse sm:blur-[120px]" />}

          {lines.length === 0 ? (
            <button onClick={handleToss} disabled={isCasting} className="group relative flex flex-col items-center gap-4 sm:gap-8 lg:gap-10">
              <div className="relative flex h-28 w-28 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.02] transition-all duration-1000 group-hover:border-primary/30 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                <div className="absolute inset-3 rounded-full border border-dashed border-primary/10 transition-transform [transition-duration:4000ms] ease-linear group-hover:rotate-180 sm:inset-4" />
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 text-2xl font-serif text-primary/30 shadow-inner transition-all duration-1000 sm:h-20 sm:w-20 sm:text-4xl",
                    isCasting ? "animate-spin scale-90 opacity-100" : "opacity-60 group-hover:scale-110 group-hover:border-primary/60 group-hover:text-primary"
                  )}
                >
                  {"\u262f"}
                </div>
              </div>
              <span className="px-2 text-center text-[10px] font-light uppercase tracking-[0.28em] text-muted-foreground/60 transition-all group-hover:text-primary group-hover:tracking-[0.35em] sm:tracking-[0.5em] sm:group-hover:tracking-[0.65em]">
                {UI.startCasting}
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
                    <HexagramLine key={index} value={line} label={LINE_LABELS[index]} />
                  ))}
                </div>
                {lines.length === 6 && (
                  <div className="mt-2 text-center animate-in slide-in-from-bottom-2 duration-1000 sm:mt-6 lg:mt-8">
                    <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.24em] text-muted-foreground/40 sm:tracking-[0.3em]">
                      {UI.primaryHex}
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
                      {UI.transformedHex}
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
              {isCasting ? UI.casting : UI.continueCasting}
            </Button>
          )}

          {lines.length === 6 && (
            <div className="w-full max-w-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 sm:space-y-10">
              <div className="relative overflow-hidden rounded-2xl border border-primary/5 bg-primary/5 p-4 text-center sm:p-6 lg:p-8">
                <Sparkles className="absolute -left-2 -top-2 h-10 w-10 text-primary/10 sm:h-12 sm:w-12" />
                <div className="mx-auto max-w-lg space-y-4">
                  <p className="font-serif text-sm italic leading-relaxed text-foreground/80 sm:text-base">"{primaryHex?.meaning}"</p>
                  {hasChangingLines && (
                    <p className="border-t border-primary/5 pt-4 font-serif text-[10px] uppercase tracking-[0.16em] text-muted-foreground/60 sm:tracking-widest">
                      {UI.transformedLead} <strong>{transformedHex?.name}</strong>: {transformedHex?.meaning}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mx-auto flex items-center gap-2 font-serif text-[10px] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary sm:tracking-[0.2em]"
              >
                <RotateCcw className="h-3 w-3" /> {UI.reset}
              </button>
            </div>
          )}
        </div>

        <div className="w-full max-w-2xl rounded-2xl border border-primary/10 bg-card/80 shadow-sm backdrop-blur-sm">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="how-it-works" className="border-b border-primary/10 px-4 sm:px-6">
              <AccordionTrigger className="py-4 text-left font-serif text-sm text-foreground hover:no-underline sm:text-base">
                {UI.guideTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                <p>{UI.guideBody1}</p>
                <p className="mt-3">{UI.guideBody2}</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="line-types" className="border-b border-primary/10 px-4 sm:px-6">
              <AccordionTrigger className="py-4 text-left font-serif text-sm text-foreground hover:no-underline sm:text-base">
                {UI.lineTypesTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {LINE_TYPE_GUIDES.map((item) => (
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
                {UI.readTitle}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
                <p>{UI.readBody1}</p>
                <p className="mt-3">{UI.readBody2}</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
