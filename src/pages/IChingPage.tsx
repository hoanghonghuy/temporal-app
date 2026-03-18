import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useHistory } from "@/contexts/HistoryContext";
import { getHexagramByLines, tossCoin } from "@/lib/iching-data";
import { RotateCcw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Minimal Hexagram Line
function HexagramLine({ value, isTransformed = false, label }: { value: number, isTransformed?: boolean, label?: string }) {
  const isYang = isTransformed ? (value === 1) : (value === 7 || value === 9);
  const isChanging = !isTransformed && (value === 6 || value === 9);

  return (
    <div className="flex items-center gap-10 group py-2.5 h-12">
      <div className="relative w-48 h-full flex items-center justify-center">
        {/* The Line */}
        {isYang ? (
          <div className={cn(
            "w-full h-1.5 bg-foreground/70 rounded-full transition-all duration-700",
            isChanging && "bg-primary shadow-[0_0_20px_rgba(var(--primary),0.4)] h-2"
          )} />
        ) : (
          <div className="w-full h-1.5 flex justify-between">
            <div className={cn("w-[43%] h-full bg-foreground/70 rounded-full transition-all duration-700", isChanging && "bg-primary h-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]")} />
            <div className={cn("w-[43%] h-full bg-foreground/70 rounded-full transition-all duration-700", isChanging && "bg-primary h-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]")} />
          </div>
        )}
        
        {/* Changing symbol moved to the LEFT to avoid overlap with labels */}
        {isChanging && (
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 text-primary font-bold animate-pulse text-lg">
            {value === 9 ? "○" : "×"}
          </div>
        )}
      </div>

      {/* Label in the middle */}
      <div className="w-16 flex justify-center shrink-0">
        {label && (
           <span className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground/40 font-serif whitespace-nowrap">
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
        const primaryBinary = newLines.map(l => (l === 7 || l === 9) ? 1 : 0).join("");
        const transformedBinary = newLines.map(l => {
            if (l === 9) return 0;
            if (l === 6) return 1;
            return (l === 7) ? 1 : 0;
        }).join("");

        const primary = getHexagramByLines(primaryBinary);
        const transformed = getHexagramByLines(transformedBinary);
        addToHistory("Gieo Quẻ", `Quẻ: ${primary?.name} → ${transformed?.name || "Không đổi"}`);
      }
    }, 600);
  };

  const handleReset = () => { setLines([]); };

  const primaryBinary = lines.length === 6 ? lines.map(l => (l === 7 || l === 9) ? 1 : 0).join("") : "";
  const tBinary = lines.length === 6 ? lines.map(l => (l === 9 ? 0 : (l === 6 ? 1 : (l === 7 ? 1 : 0)))).join("") : "";
  const primaryHex = primaryBinary ? getHexagramByLines(primaryBinary) : null;
  const transformedHex = tBinary ? getHexagramByLines(tBinary) : null;
  const hasChangingLines = lines.some(l => l === 6 || l === 9);

  const lineLabels = ["Sơ", "Nhị", "Tam", "Tứ", "Ngũ", "Thượng"];

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 animate-in fade-in duration-1000 relative">
      {/* Visual background details to reduce "boring" feel */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06] -z-10">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] border border-primary rounded-full shadow-[0_0_100px_rgba(var(--primary),0.1)_inset]" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/40 rounded-full border-dashed" />
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/20 rounded-full" />
      </div>

      {/* Header Zen */}
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-serif tracking-[0.4em] font-light text-foreground/90 uppercase bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50">Thiên Cơ</h1>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto" />
        <p className="text-xs font-serif italic text-muted-foreground/50 tracking-[0.3em]">
          {lines.length === 0 ? "TÂM TĨNH • Ý KHỞI • QUẺ TỰ HIỆN" : "TRỜI ĐẤT LUÂN HỒI • NHÂN QUẢ HIỂN HIỆN"}
        </p>
      </div>

      <div className="flex flex-col items-center space-y-24">
        {/* Progress Dots with labels */}
        <div className="flex items-center gap-6">
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground/30 font-serif">Tiến độ</span>
          <div className="flex gap-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-700",
                  lines.length > i ? "bg-primary scale-125 shadow-[0_0_8px_rgba(var(--primary),0.6)]" : "bg-primary/5 border border-primary/10"
                )} 
              />
            ))}
          </div>
        </div>

        {/* Hexagram Display Area */}
        <div className="flex flex-col items-center w-full min-h-[400px] justify-center relative">
            {/* Subtle radial glow when result is ready */}
            {lines.length === 6 && (
                <div className="absolute inset-0 bg-primary/[0.02] rounded-full blur-[120px] -z-10 animate-pulse" />
            )}

            {lines.length === 0 ? (
                <button 
                  onClick={handleToss}
                  disabled={isCasting}
                  className="group relative flex flex-col items-center gap-10"
                >
                    <div className="w-40 h-40 rounded-full border border-primary/10 flex items-center justify-center group-hover:border-primary/30 transition-all duration-1000 bg-primary/[0.02] relative">
                        <div className="absolute inset-4 rounded-full border border-dashed border-primary/10 group-hover:rotate-180 transition-transform duration-[4000ms] ease-linear" />
                        <div className={cn(
                            "w-20 h-20 rounded-full border border-primary/30 flex items-center justify-center text-primary/30 text-4xl font-serif transition-all duration-1000 shadow-inner",
                            isCasting ? "animate-spin scale-90 opacity-100" : "group-hover:scale-110 group-hover:text-primary group-hover:border-primary/60 opacity-60"
                        )}>☯</div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.6em] font-light text-muted-foreground/60 group-hover:text-primary transition-all group-hover:tracking-[0.8em]">
                        Khởi Tâm Gieo Quẻ
                    </span>
                </button>
            ) : (
                <div className={cn("flex gap-12 sm:gap-20 transition-all duration-1000", lines.length < 6 ? "opacity-90" : "opacity-100")}>
                    {/* Bản Quái */}
                    <div className="flex flex-col-reverse items-center gap-4">
                        <div className="flex flex-col-reverse">
                            {lines.map((l, idx) => (
                                <HexagramLine key={idx} value={l} label={lineLabels[idx]} />
                            ))}
                        </div>
                        {lines.length === 6 && (
                            <div className="text-center mt-8 animate-in slide-in-from-bottom-2 duration-1000">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 block mb-2 font-serif">Bản Quái</span>
                                <h3 className="font-serif font-medium text-2xl text-primary tracking-tight">{primaryHex?.name}</h3>
                            </div>
                        )}
                    </div>

                    {/* Biến Quái */}
                    {lines.length === 6 && hasChangingLines && (
                        <div className="flex flex-col-reverse items-center gap-4 animate-in fade-in slide-in-from-left-8 duration-[1200ms]">
                            <div className="flex flex-col-reverse">
                                {tBinary.split("").reverse().map((char, idx) => (
                                    <HexagramLine key={idx} value={parseInt(char)} isTransformed />
                                ))}
                            </div>
                            <div className="text-center mt-8">
                                <span className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 block mb-2 font-serif">Biến Quái</span>
                                <h3 className="font-serif font-medium text-2xl text-primary tracking-tight">{transformedHex?.name}</h3>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Action Button & Meaning */}
        <div className="w-full flex flex-col items-center">
            {lines.length > 0 && lines.length < 6 && (
                <Button 
                   onClick={handleToss}
                   disabled={isCasting}
                   variant="ghost"
                   className="font-serif uppercase tracking-[0.3em] text-xs hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all px-12 h-14"
                >
                   {isCasting ? "Đang định hào..." : "Tiếp tục gieo"}
                </Button>
            )}

            {lines.length === 6 && (
                <div className="w-full max-w-2xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="bg-primary/5 rounded-2xl p-8 border border-primary/5 text-center relative overflow-hidden">
                       <Sparkles className="absolute -top-2 -left-2 w-12 h-12 text-primary/10" />
                       <div className="max-w-lg mx-auto space-y-4">
                           <p className="font-serif italic text-sm leading-relaxed text-foreground/80">
                             "{primaryHex?.meaning}"
                           </p>
                           {hasChangingLines && (
                               <p className="text-[10px] text-muted-foreground/60 font-serif uppercase tracking-widest pt-4 border-t border-primary/5">
                                 Sự việc biến chuyển thành <strong>{transformedHex?.name}</strong>: {transformedHex?.meaning}
                               </p>
                           )}
                       </div>
                    </div>
                    
                    <button 
                        onClick={handleReset}
                        className="flex items-center gap-2 mx-auto text-[10px] uppercase tracking-[0.2em] font-serif text-muted-foreground hover:text-primary transition-colors"
                    >
                        <RotateCcw className="w-3 h-3" /> Gieo Quẻ Khác
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}


