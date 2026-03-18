import { Github, Sparkles } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

export function Footer() {
  const { dictionary } = useI18n();

  return (
    <footer className="mt-12 border-t border-primary/15 bg-card/50 text-muted-foreground">
      <div className="container py-6 text-center text-sm">
        <div className="mb-1 flex items-center justify-center gap-1.5">
          <Sparkles className="h-3 w-3 text-primary/50" />
          <span className="text-xs uppercase tracking-widest text-muted-foreground/70">{dictionary.footerMotto}</span>
          <Sparkles className="h-3 w-3 text-primary/50" />
        </div>
        <p>
          {dictionary.footerDesignedBy}{" "}
          <a
            href="https://github.com/hoanghonghuy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-foreground transition-colors hover:text-primary"
          >
            <Github className="h-3.5 w-3.5" />
            hoanghonghuy
          </a>
        </p>
      </div>
    </footer>
  );
}
