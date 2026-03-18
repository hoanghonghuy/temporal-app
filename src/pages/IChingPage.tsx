import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/contexts/HistoryContext";
import { getHexagramByLines, tossCoin } from "@/lib/iching-data";
import { RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function HexagramLine({ value, isTransformed = false, label }: { value: number; isTransformed?: boolean; label?: string }) {
  const isYang = isTransformed ? value === 1 : value === 7 || value === 9;
  const isChanging = !isTransformed && (value === 6 || value === 9);

  return (
    <div className="grid w-full grid-cols-[1rem_minmax(0,1fr)_2.5rem] items-center gap-2 py-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_3.5rem] sm:gap-4 lg:grid-cols-[2rem_minmax(0,1fr)_4rem] lg:gap-6">
      <div className="flex items-center justify-center text-sm font-bold text-primary sm:text-base lg:text-lg">
        {isChanging && <span className="animate-pulse">{value === 9 ? "○" : "×"}</span>}
      </div>

      <div className="flex h-8 items-center justify-center sm:h-10">
        {isYang ? (
          <div
            className={cn(
              "h-1.5 w-full max-w-[9.5rem] rounded-full bg-foreground/70 transition-all duration-700 sm:max-w-40 lg:max-w-48",
              isChanging && "h-2 bg-primary shadow-[0_0_20px_hsl(var(--primary)/0.35)]"
            )}
          />
        ) : (
          <div className="flex h-1.5 w-full max-w-[9.5rem] justify-between sm:max-w-40 lg:max-w-48">
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
          <span className="whitespace-nowrap font-serif text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 sm:text-[10px] sm:tracking-[0.28em] lg:tracking-[0.4em]">
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
        const primaryBinary = newLines.map((l) => (l === 7 || l === 9 ? 1 : 0)).join("");
        const transformedBinary = newLines
          .map((l) => {
            if (l === 9) return 0;
            if (l === 6) return 1;
            return l === 7 ? 1 : 0;
          })
          .join("");

        const primary = getHexagramByLines(primaryBinary);
        const transformed = getHexagramByLines(transformedBinary);
        addToHistory("Gieo Quẻ", `Quẻ: ${primary?.name} → ${transformed?.name || "Không đổi"}`);
      }
    }, 600);
  };

  const handleReset = () => {
    setLines([]);
  };

  const primaryBinary = lines.length === 6 ? lines.map((l) => (l === 7 || l === 9 ? 1 : 0)).join("") : "";
  const tBinary =
    lines.length === 6
      ? lines.map((l) => (l === 9 ? 0 : l === 6 ? 1 : l === 7 ? 1 : 0)).join("")
      : "";
  const primaryHex = primaryBinary ? getHexagramByLines(primaryBinary) : null;
  const transformedHex = tBinary ? getHexagramByLines(tBinary) : null;
  const hasChangingLines = lines.some((l) => l === 6 || l === 9);

  const lineLabels = ["Sơ", "Nhị", "Tam", "Tứ", "Ngũ", "Thượng"];

  return (
    <div className="relative mx-auto max-w-5xl animate-in fade-in px-0 py-6 duration-1000 sm:px-2 sm:py-8 lg:py-12">
      <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06]">
        <div className="absolute top-1/2 left-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary shadow-[inset_0_0_100px_hsl(var(--primary)/0.1)] sm:h-[520px] sm:w-[520px] lg:h-[900px] lg:w-[900px]" />
        <div className="absolute top-1/2 left-1/2 h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-primary/40 sm:h-[360px] sm:w-[360px] lg:h-[700px] lg:w-[700px]" />
        <div className="absolute top-1/2 left-1/2 h-[160px] w-[160px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/20 sm:h-[220px] sm:w-[220px] lg:h-[400px] lg:w-[400px]" />
      </div>

      <div className="mb-10 space-y-3 text-center sm:mb-14 sm:space-y-4 lg:mb-16">
        <h1 className="bg-gradient-to-b from-foreground to-foreground/50 bg-clip-text text-3xl font-serif font-light uppercase tracking-[0.24em] text-transparent sm:text-4xl sm:tracking-[0.32em] lg:text-5xl lg:tracking-[0.4em]">
          Thiên Cơ
        </h1>
        <div className="mx-auto h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <p className="mx-auto max-w-xl px-2 text-[10px] font-serif italic leading-relaxed tracking-[0.18em] text-muted-foreground/50 sm:px-0 sm:text-xs sm:tracking-[0.3em]">
          {lines.length === 0 ? "TÂM TĨNH • Ý KHỞI • QUẺ TỰ HIỆN" : "TRỜI ĐẤT LUÂN HỒI • NHÂN QUẢ HIỂN HIỆN"}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-10 sm:space-y-16 lg:space-y-24">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
          <span className="font-serif text-[9px] uppercase tracking-widest text-muted-foreground/30">Tiến độ</span>
          <div className="flex gap-3 sm:gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full transition-all duration-700",
                  lines.length > i ? "scale-125 bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.45)]" : "border border-primary/10 bg-primary/5"
                )}
              />
            ))}
          </div>
        </div>

        <div className="relative flex min-h-[280px] w-full flex-col items-center justify-center sm:min-h-[320px] md:min-h-[360px] lg:min-h-[400px]">
          {lines.length === 6 && <div className="absolute inset-0 -z-10 rounded-full bg-primary/[0.02] blur-[80px] animate-pulse sm:blur-[120px]" />}

          {lines.length === 0 ? (
            <button onClick={handleToss} disabled={isCasting} className="group relative flex flex-col items-center gap-6 sm:gap-8 lg:gap-10">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-primary/10 bg-primary/[0.02] transition-all duration-1000 group-hover:border-primary/30 sm:h-36 sm:w-36 lg:h-40 lg:w-40">
                <div className="absolute inset-3 rounded-full border border-dashed border-primary/10 transition-transform [transition-duration:4000ms] ease-linear group-hover:rotate-180 sm:inset-4" />
                <div
                  className={cn(
                    "flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 text-3xl font-serif text-primary/30 shadow-inner transition-all duration-1000 sm:h-20 sm:w-20 sm:text-4xl",
                    isCasting ? "animate-spin scale-90 opacity-100" : "opacity-60 group-hover:scale-110 group-hover:border-primary/60 group-hover:text-primary"
                  )}
                >
                  ☯
                </div>
              </div>
              <span className="px-2 text-center text-[10px] font-light uppercase tracking-[0.35em] text-muted-foreground/60 transition-all group-hover:text-primary group-hover:tracking-[0.45em] sm:tracking-[0.5em] sm:group-hover:tracking-[0.65em]">
                Khởi Tâm Gieo Quẻ
              </span>
            </button>
          ) : (
            <div
              className={cn(
                "flex w-full flex-col items-center gap-10 transition-all duration-1000 md:flex-row md:items-start md:justify-center md:gap-10 lg:gap-16",
                lines.length < 6 ? "opacity-90" : "opacity-100"
              )}
            >
              <div className="flex w-full max-w-sm flex-col-reverse items-center gap-4 sm:max-w-md">
                <div className="flex w-full flex-col-reverse">
                  {lines.map((l, idx) => (
                    <HexagramLine key={idx} value={l} label={lineLabels[idx]} />
                  ))}
                </div>
                {lines.length === 6 && (
                  <div className="mt-4 text-center animate-in slide-in-from-bottom-2 duration-1000 sm:mt-6 lg:mt-8">
                    <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">Bản Quái</span>
                    <h3 className="font-serif text-xl font-medium tracking-tight text-primary sm:text-2xl">{primaryHex?.name}</h3>
                  </div>
                )}
              </div>

              {lines.length === 6 && hasChangingLines && (
                <div className="flex w-full max-w-sm flex-col-reverse items-center gap-4 animate-in fade-in slide-in-from-left-8 [animation-duration:1200ms] sm:max-w-md">
                  <div className="flex w-full flex-col-reverse">
                    {tBinary
                      .split("")
                      .reverse()
                      .map((char, idx) => (
                        <HexagramLine key={idx} value={parseInt(char, 10)} isTransformed />
                      ))}
                  </div>
                  <div className="mt-4 text-center sm:mt-6 lg:mt-8">
                    <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40">Biến Quái</span>
                    <h3 className="font-serif text-xl font-medium tracking-tight text-primary sm:text-2xl">{transformedHex?.name}</h3>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          {lines.length > 0 && lines.length < 6 && (
            <Button
              onClick={handleToss}
              disabled={isCasting}
              variant="ghost"
              className="h-12 w-full max-w-xs px-6 font-serif text-[10px] uppercase tracking-[0.24em] text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary sm:h-14 sm:w-auto sm:max-w-none sm:px-10 sm:text-xs sm:tracking-[0.3em]"
            >
              {isCasting ? "Đang định hào..." : "Tiếp tục gieo"}
            </Button>
          )}

          {lines.length === 6 && (
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 sm:space-y-12">
              <div className="relative overflow-hidden rounded-2xl border border-primary/5 bg-primary/5 p-5 text-center sm:p-6 lg:p-8">
                <Sparkles className="absolute -top-2 -left-2 h-10 w-10 text-primary/10 sm:h-12 sm:w-12" />
                <div className="mx-auto max-w-lg space-y-4">
                  <p className="font-serif text-sm italic leading-relaxed text-foreground/80 sm:text-base">"{primaryHex?.meaning}"</p>
                  {hasChangingLines && (
                    <p className="border-t border-primary/5 pt-4 font-serif text-[10px] uppercase tracking-[0.18em] text-muted-foreground/60 sm:tracking-widest">
                      Sự việc biến chuyển thành <strong>{transformedHex?.name}</strong>: {transformedHex?.meaning}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleReset}
                className="mx-auto flex items-center gap-2 font-serif text-[10px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-primary sm:tracking-[0.2em]"
              >
                <RotateCcw className="h-3 w-3" /> Gieo Quẻ Khác
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
