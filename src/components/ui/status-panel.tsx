import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusPanelProps {
  variant: "loading" | "empty" | "error" | "info";
  message: string;
  className?: string;
}

export function StatusPanel({ variant, message, className }: StatusPanelProps) {
  const iconClass = "h-5 w-5";

  const icon =
    variant === "loading" ? (
      <LoaderCircle className={cn(iconClass, "animate-spin text-primary")} />
    ) : variant === "empty" ? (
      <Inbox className={cn(iconClass, "text-muted-foreground")} />
    ) : variant === "error" ? (
      <AlertCircle className={cn(iconClass, "text-destructive")} />
    ) : (
      <Inbox className={cn(iconClass, "text-primary/80")} />
    );

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      aria-live={variant === "loading" ? "polite" : "off"}
      className={cn(
        "gold-glow flex items-center justify-center gap-2 rounded-lg border border-primary/10 bg-card/80 p-6 text-center text-sm text-muted-foreground",
        className
      )}
    >
      {icon}
      <span className="font-serif">{message}</span>
    </div>
  );
}
