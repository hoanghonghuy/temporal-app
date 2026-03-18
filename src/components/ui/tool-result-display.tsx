import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ToolResultDisplayProps {
  children: ReactNode;
  className?: string;
}

export function ToolResultDisplay({ children, className }: ToolResultDisplayProps) {
  return (
    <div className={cn("mt-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm gold-glow animate-in fade-in duration-300", className)}>
      <p className="font-medium text-foreground font-serif text-center italic leading-relaxed">
        {children}
      </p>
    </div>
  );
}
